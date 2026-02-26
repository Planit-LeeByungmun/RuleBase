import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { foldersApi } from '../../api/folders';
import { filesApi } from '../../api/files';
import type { Folder, FileItem } from '../../types';
import { useFolderStore } from '../../store/folderStore';
import { useNavigate } from 'react-router-dom';

function SummaryFolderNode({ folder, files }: { folder: Folder; files: FileItem[] }) {
  const [expanded, setExpanded] = useState(true);
  const { setSelectedFolder, setSelectedFile } = useFolderStore();
  const navigate = useNavigate();
  const folderFiles = files.filter(f => f.folder_id === folder.id);

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-blue-600 group py-1"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-400 text-xs">{expanded ? '▾' : '▸'}</span>
        <span className="text-yellow-500">📁</span>
        <span className="font-medium text-gray-700 group-hover:text-blue-600">{folder.name}</span>
        <span className="text-xs text-gray-400">({folderFiles.length}개 파일)</span>
      </div>
      {expanded && (
        <div className="ml-6 mt-0.5 space-y-0.5">
          {folderFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-blue-50 cursor-pointer text-sm text-gray-600"
              onClick={() => {
                setSelectedFolder(file.folder_id);
                setSelectedFile(file.id);
                navigate('/documents');
              }}
            >
              <span className="text-xs">📄</span>
              <span className="hover:text-blue-600">{file.original_name}</span>
            </div>
          ))}
          {folder.children?.map(child => (
            <SummaryFolderNode key={child.id} folder={child} files={files} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SummaryPage() {
  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: async () => {
      const res = await foldersApi.getTree();
      return res.data.data as Folder[];
    },
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['files', 'all'],
    queryFn: async () => {
      const res = await filesApi.getAll();
      return res.data.data as FileItem[];
    },
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto w-full px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">문서 요약</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {(foldersLoading || filesLoading) && <p className="text-gray-400">로딩 중...</p>}
          {folders?.length === 0 && !foldersLoading && (
            <p className="text-gray-400 text-center py-8">폴더가 없습니다</p>
          )}
          {folders?.map(folder => (
            <SummaryFolderNode key={folder.id} folder={folder} files={files || []} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
