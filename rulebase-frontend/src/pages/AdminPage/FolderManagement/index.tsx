import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { foldersApi } from '../../../api/folders';
import { useUiStore } from '../../../store/uiStore';
import type { Folder } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

function flattenFolders(
  folders: Folder[],
  expandedIds: Set<number>,
  depth = 0,
): Array<{ folder: Folder; depth: number }> {
  return folders.flatMap(f => [
    { folder: f, depth },
    ...(expandedIds.has(f.id) ? flattenFolders(f.children || [], expandedIds, depth + 1) : []),
  ]);
}

function collectAllIds(folders: Folder[]): number[] {
  return folders.flatMap(f => [f.id, ...collectAllIds(f.children || [])]);
}

function SortableFolderRow({
  folder,
  depth,
  isExpanded,
  hasChildren,
  onToggle,
  onAddSub,
  onEdit,
  onDelete,
}: {
  folder: Folder;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: (id: number) => void;
  onAddSub: (id: number) => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: `${12 + depth * 24}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 touch-none"
        title="드래그하여 순서 변경"
      >
        ⠿
      </button>
      {hasChildren ? (
        <button
          onClick={() => onToggle(folder.id)}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 transition-transform"
          title={isExpanded ? '접기' : '펼치기'}
        >
          <span className={`text-xs transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
        </button>
      ) : (
        <span className="w-5 h-5 flex-shrink-0" />
      )}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        depth === 0 ? 'bg-amber-50' : 'bg-gray-50'
      }`}>
        <span className="text-sm">{depth === 0 ? '📂' : '📁'}</span>
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800">{folder.name}</span>
      <div className="flex gap-1">
        <button
          onClick={() => onAddSub(folder.id)}
          className="text-xs text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
        >
          하위폴더
        </button>
        <button
          onClick={() => onEdit(folder)}
          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
        >
          편집
        </button>
        <button
          onClick={() => onDelete(folder)}
          className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/** Group siblings that share the same parentId */
function getSiblingGroups(flatList: Array<{ folder: Folder; depth: number }>) {
  const groups = new Map<number | null, Folder[]>();
  for (const { folder } of flatList) {
    const key = folder.parent_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(folder);
  }
  return groups;
}

export function FolderManagement() {
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentId, setParentId] = useState<number | undefined>();
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState('');
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: folders, isLoading } = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: async () => {
      const res = await foldersApi.getTree();
      return res.data.data as Folder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => foldersApi.create({ name: newFolderName, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setShowCreate(false);
      setNewFolderName('');
      setParentId(undefined);
      addToast('폴더가 생성되었습니다.', 'success');
    },
    onError: () => addToast('폴더 생성에 실패했습니다.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () => foldersApi.update(editingFolder!.id, { name: editName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setEditingFolder(null);
      addToast('폴더명이 변경되었습니다.', 'success');
    },
    onError: () => addToast('변경에 실패했습니다.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => foldersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      addToast('폴더가 삭제되었습니다.', 'success');
    },
    onError: () => addToast('삭제에 실패했습니다.', 'error'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) => foldersApi.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: () => addToast('순서 변경에 실패했습니다.', 'error'),
  });

  const flatFolders = useMemo(() => (folders ? flattenFolders(folders, expandedIds) : []), [folders, expandedIds]);

  // Build a set of folder IDs that have children
  const hasChildrenSet = useMemo(() => {
    if (!folders) return new Set<number>();
    const allFlat = flattenFolders(folders, new Set(collectAllIds(folders)));
    const set = new Set<number>();
    for (const { folder } of allFlat) {
      if (folder.children && folder.children.length > 0) set.add(folder.id);
    }
    return set;
  }, [folders]);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const siblingGroups = useMemo(() => getSiblingGroups(flatFolders), [flatFolders]);

  // Build a flat lookup for parent_id
  const folderById = useMemo(() => {
    const map = new Map<number, { folder: Folder; depth: number }>();
    for (const item of flatFolders) map.set(item.folder.id, item);
    return map;
  }, [flatFolders]);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = folderById.get(active.id as number);
    const overItem = folderById.get(over.id as number);
    if (!activeItem || !overItem) return;

    // Only allow reorder within same parent
    if (activeItem.folder.parent_id !== overItem.folder.parent_id) return;

    const parentKey = activeItem.folder.parent_id;
    const siblings = siblingGroups.get(parentKey);
    if (!siblings) return;

    const oldIndex = siblings.findIndex(f => f.id === active.id);
    const newIndex = siblings.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);
    const items = reordered.map((f, i) => ({ id: f.id, sortOrder: i }));
    reorderMutation.mutate(items);
  }

  const activeDragItem = activeDragId ? folderById.get(activeDragId) : null;

  // Collect all folder IDs for sortable context
  const allFolderIds = useMemo(() => flatFolders.map(f => f.folder.id), [flatFolders]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📁</span>
          <h2 className="text-sm font-semibold text-gray-900">폴더 관리</h2>
          {!isLoading && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {flatFolders.length}개
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>새 폴더</Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : flatFolders.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-gray-400 text-sm">폴더가 없습니다</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allFolderIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {flatFolders.map(({ folder, depth }) => (
                  <SortableFolderRow
                    key={folder.id}
                    folder={folder}
                    depth={depth}
                    isExpanded={expandedIds.has(folder.id)}
                    hasChildren={hasChildrenSet.has(folder.id)}
                    onToggle={toggleExpand}
                    onAddSub={(id) => { setParentId(id); setNewFolderName(''); setShowCreate(true); }}
                    onEdit={(f) => { setEditingFolder(f); setEditName(f.name); }}
                    onDelete={(f) => {
                      const msg = f.parent_id === null
                        ? `"${f.name}" 최상위 폴더와 하위 폴더를 모두 삭제하시겠습니까?`
                        : `"${f.name}" 폴더를 삭제하시겠습니까?`;
                      if (window.confirm(msg)) deleteMutation.mutate(f.id);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragItem ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-lg border border-blue-200"
                  style={{ paddingLeft: `${12 + activeDragItem.depth * 24}px` }}
                >
                  <span className="text-gray-400">⠿</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeDragItem.depth === 0 ? 'bg-amber-50' : 'bg-gray-50'
                  }`}>
                    <span className="text-sm">{activeDragItem.depth === 0 ? '📂' : '📁'}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{activeDragItem.folder.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="새 폴더 만들기"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newFolderName.trim()}>만들기</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="폴더 이름" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상위 폴더 (선택)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={parentId || ''}
              onChange={e => setParentId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            >
              <option value="">최상위 폴더</option>
              {flatFolders.map(({ folder, depth }) => (
                <option key={folder.id} value={folder.id}>{'　'.repeat(depth)}{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editingFolder} onClose={() => setEditingFolder(null)} title="폴더 이름 변경"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingFolder(null)}>취소</Button>
            <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>변경</Button>
          </>
        }
      >
        <Input label="새 폴더 이름" value={editName} onChange={e => setEditName(e.target.value)} />
      </Modal>
    </div>
  );
}
