import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolderTree } from '../../../hooks/useFolderTree';
import { useFolderStore } from '../../../store/folderStore';
import { FolderTreeNode } from './FolderTreeNode';

export function FolderSidebar() {
  const { data: folders, isLoading, allFolderIds } = useFolderTree();
  const { expandAll, collapseAll } = useFolderStore();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="w-64 min-w-64 bg-white border-r border-gray-200 p-4 text-sm text-gray-400">폴더 로딩 중...</div>;
  }

  return (
    <div className="w-64 min-w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">폴더</h2>
          <button
            onClick={() => navigate('/summary')}
            className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            요약
          </button>
        </div>
        <div className="flex gap-1 text-xs">
          <button onClick={() => expandAll(allFolderIds)} className="text-blue-600 hover:underline">모두 펼치기</button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-gray-500 hover:underline">접기</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {folders?.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">폴더가 없습니다</p>
        )}
        {folders?.map(folder => (
          <FolderTreeNode key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}
