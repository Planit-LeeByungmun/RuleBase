import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '../../../api/files';
import { useFolderStore } from '../../../store/folderStore';
import { useAuth } from '../../../hooks/useAuth';
import { useUiStore } from '../../../store/uiStore';
import { Button } from '../../../components/ui/Button';
import type { FileItem } from '../../../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📋';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType.includes('word')) return '📄';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  return '📁';
}

export function FileList() {
  const { selectedFolderId, selectedFileId, setSelectedFile } = useFolderStore();
  const { isAdmin } = useAuth();
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', selectedFolderId],
    queryFn: async () => {
      if (!selectedFolderId) return [];
      const res = await filesApi.getByFolder(selectedFolderId);
      return res.data.data as FileItem[];
    },
    enabled: !!selectedFolderId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => filesApi.upload(selectedFolderId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['files', 'all'] });
      addToast('파일이 업로드되었습니다.', 'success');
    },
    onError: () => addToast('업로드에 실패했습니다.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', selectedFolderId] });
      queryClient.invalidateQueries({ queryKey: ['files', 'all'] });
      addToast('파일이 삭제되었습니다.', 'success');
    },
    onError: () => addToast('삭제에 실패했습니다.', 'error'),
  });

  if (!selectedFolderId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3">📂</div>
          <p>폴더를 선택하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 min-w-72 border-r border-gray-200 flex flex-col bg-white">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">파일 목록</h2>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) {
                uploadMutation.mutate(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
            업로드
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-4 text-gray-400 text-sm">로딩 중...</div>}
        {!isLoading && files?.length === 0 && (
          <div className="flex items-center justify-center text-gray-400 py-12">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm">파일이 없습니다</p>
            </div>
          </div>
        )}
        {files?.map(file => (
          <div
            key={file.id}
            onClick={() => setSelectedFile(file.id)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors ${
              selectedFileId === file.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.original_name}</p>
              <p className="text-xs text-gray-400">{formatSize(file.file_size)} · {file.uploaded_by_name}</p>
            </div>
            {isAdmin && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm('파일을 삭제하시겠습니까?')) deleteMutation.mutate(file.id);
                }}
                className="text-red-400 hover:text-red-600 text-xs px-1"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
