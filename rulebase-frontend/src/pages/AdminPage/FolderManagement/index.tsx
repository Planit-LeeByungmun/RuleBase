import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../../../api/folders';
import { useUiStore } from '../../../store/uiStore';
import type { Folder } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

function flattenFolders(folders: Folder[], depth = 0): Array<{ folder: Folder; depth: number }> {
  return folders.flatMap(f => [
    { folder: f, depth },
    ...flattenFolders(f.children || [], depth + 1),
  ]);
}

export function FolderManagement() {
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentId, setParentId] = useState<number | undefined>();
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState('');

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

  const flatFolders = folders ? flattenFolders(folders) : [];

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
          <div className="space-y-1">
            {flatFolders.map(({ folder, depth }) => (
              <div
                key={folder.id}
                className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ paddingLeft: `${12 + depth * 24}px` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  depth === 0 ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  <span className="text-sm">{depth === 0 ? '📂' : '📁'}</span>
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800">{folder.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingFolder(folder); setEditName(folder.name); }}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    편집
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?`))
                        deleteMutation.mutate(folder.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
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
