

import { useFolderStore } from '../../../store/folderStore';
import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../../../api/files';
import { useAuthStore } from '../../../store/authStore';
import type { FileItem } from '../../../types';
import { QAPanel } from './QAPanel';

export function FileViewer() {
  const { selectedFileId } = useFolderStore();
  const token = useAuthStore(s => s.token);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

  const { data: files } = useQuery({
    queryKey: ['files', 'all'],
    queryFn: async () => {
      const res = await filesApi.getAll();
      return res.data.data as FileItem[];
    },
  });

  const file = files?.find(f => f.id === selectedFileId);

  if (!selectedFileId || !file) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-3">👆</div>
          <p className="text-sm">파일을 선택하면 여기서 열립니다</p>
        </div>
      </div>
    );
  }

  const viewUrl = `${apiBase}/files/${file.id}/view?token=${token}`;
  const downloadUrl = `${apiBase}/files/${file.id}/download?token=${token}`;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between bg-white">
          <span className="text-sm font-medium text-gray-700 truncate">{file.original_name}</span>
          <a href={downloadUrl} className="text-sm text-blue-600 hover:underline ml-2 whitespace-nowrap" download>
            다운로드
          </a>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100">
          <FileRenderer file={file} viewUrl={viewUrl} />
        </div>
      </div>
      <QAPanel fileId={file.id} />
    </div>
  );
}

function FileRenderer({ file, viewUrl }: { file: FileItem; viewUrl: string }) {
  if (file.mime_type === 'application/pdf' || file.mime_type.startsWith('text/')) {
    return <iframe src={viewUrl} className="w-full h-full" title={file.original_name} />;
  }

  if (file.mime_type.startsWith('image/')) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <img src={viewUrl} alt={file.original_name} className="max-w-full max-h-full object-contain rounded shadow" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <div className="text-5xl mb-3">📄</div>
        <p className="font-medium">{file.original_name}</p>
        <p className="text-sm mt-1">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
        <a href={viewUrl} download className="mt-3 inline-block text-blue-600 hover:underline text-sm">
          다운로드하여 열기
        </a>
      </div>
    </div>
  );
}
