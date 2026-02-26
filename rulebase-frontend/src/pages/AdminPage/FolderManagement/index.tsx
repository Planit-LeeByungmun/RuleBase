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

  const { data: folders } = useQuery({
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">폴더 관리</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>새 폴더</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {flatFolders.length === 0 && (
          <p className="text-gray-400 text-sm p-4">폴더가 없습니다</p>
        )}
        {flatFolders.map(({ folder, depth }) => (
          <div key={folder.id} className="flex items-center gap-3 p-3">
            <div style={{ marginLeft: `${depth * 20}px` }} className="flex items-center gap-2 flex-1">
              <span className="text-yellow-500">📁</span>
              <span className="text-sm text-gray-700">{folder.name}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingFolder(folder); setEditName(folder.name); }}
                className="text-xs text-blue-600 hover:underline"
              >편집</button>
              <button
                onClick={() => {
                  if (window.confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?`))
                    deleteMutation.mutate(folder.id);
                }}
                className="text-xs text-red-500 hover:underline"
              >삭제</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="새 폴더 만들기"
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
                <option key={folder.id} value={folder.id}>
                  {'　'.repeat(depth)}{folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        title="폴더 이름 변경"
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
