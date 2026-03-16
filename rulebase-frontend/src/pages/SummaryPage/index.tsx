import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { foldersApi } from '../../api/folders';
import { filesApi } from '../../api/files';
import type { Folder, FileItem } from '../../types';
import { useFolderStore } from '../../store/folderStore';
import { useNavigate } from 'react-router-dom';

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📋';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType.includes('word')) return '📄';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  return '📁';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function countAllFiles(folder: Folder, files: FileItem[]): number {
  let count = files.filter(f => f.folder_id === folder.id).length;
  for (const child of folder.children || []) {
    count += countAllFiles(child, files);
  }
  return count;
}

function SummaryFolderNode({ folder, files, depth = 0 }: { folder: Folder; files: FileItem[]; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const { setSelectedFolder, setSelectedFile } = useFolderStore();
  const navigate = useNavigate();
  const folderFiles = files.filter(f => f.folder_id === folder.id);
  const totalFiles = countAllFiles(folder, files);
  const hasChildren = folderFiles.length > 0 || (folder.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 group ${
          depth === 0 ? '' : 'ml-4'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          expanded && hasChildren ? 'bg-amber-50' : 'bg-gray-50'
        }`}>
          <span className="text-sm">{expanded && hasChildren ? '📂' : '📁'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600">{folder.name}</span>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {totalFiles}개
        </span>
        <span className="text-gray-300 text-xs transition-transform">
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </span>
      </div>

      {expanded && (
        <div className={depth === 0 ? 'ml-4' : 'ml-8'}>
          {folderFiles.length > 0 && (
            <div className="space-y-0.5 my-1">
              {folderFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group/file"
                  onClick={() => {
                    setSelectedFolder(file.folder_id);
                    setSelectedFile(file.id);
                    navigate('/documents');
                  }}
                >
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">{getFileIcon(file.mime_type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 group-hover/file:text-blue-600 truncate">{file.original_name}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.file_size)} · {file.uploaded_by_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {folder.children?.map(child => (
            <SummaryFolderNode key={child.id} folder={child} files={files} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SummaryPage() {
  const [_expandAll, _setExpandAll] = useState(true);

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

  const isLoading = foldersLoading || filesLoading;
  const totalFolders = folders?.length ?? 0;
  const totalFiles = files?.length ?? 0;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">문서 요약</h1>
            {!isLoading && (
              <p className="text-sm text-gray-500 mt-1">
                총 {totalFolders}개 폴더 · {totalFiles}개 파일
              </p>
            )}
          </div>
        </div>

        {/* Folder Tree */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🗂️</span>
              <h2 className="text-sm font-semibold text-gray-900">폴더 구조</h2>
            </div>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : totalFolders === 0 ? (
              <div className="py-12 text-center">
                <span className="text-4xl block mb-3">📭</span>
                <p className="text-gray-400 text-sm">폴더가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {folders?.map(folder => (
                  <SummaryFolderNode key={folder.id} folder={folder} files={files || []} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
