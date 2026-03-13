import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';

interface DashboardStats {
  total_files: number;
  total_folders: number;
  unresolved_questions: number;
  total_faq_items: number;
}

interface RecentFile {
  id: number;
  original_name: string;
  folder_name: string;
  uploader_name: string;
  created_at: string;
}

interface RecentQuestion {
  id: number;
  body: string;
  file_name: string;
  author_name: string;
  is_resolved: boolean;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentFiles: RecentFile[];
  recentQuestions: RecentQuestion[];
}

const statCards = [
  { key: 'total_files' as const, label: '총 문서 수', icon: '📄', gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600' },
  { key: 'total_folders' as const, label: '총 폴더 수', icon: '📁', gradient: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600' },
  { key: 'unresolved_questions' as const, label: '미해결 질문', icon: '❓', gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-600' },
  { key: 'total_faq_items' as const, label: 'FAQ 항목', icon: '💡', gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-600' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function DashboardPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await dashboardApi.getAll();
      return res.data.data as DashboardData;
    },
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">대시보드</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <div key={card.key} className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-full`} />
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.light}`}>{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <span className="inline-block w-10 h-7 bg-gray-200 rounded animate-pulse" />
              ) : (
                (data?.stats[card.key] ?? 0).toLocaleString()
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Files */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 flex items-center gap-2">
          <span className="text-base">📄</span>
          <h3 className="text-sm font-semibold text-gray-900">최근 업로드된 파일</h3>
        </div>
        <div className="px-5 pb-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : !data?.recentFiles.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">파일이 없습니다</div>
          ) : (
            data.recentFiles.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-500 text-sm">📋</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.original_name}</p>
                  <p className="text-xs text-gray-400">{file.folder_name} · {file.uploader_name}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(file.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Questions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 flex items-center gap-2">
          <span className="text-base">💬</span>
          <h3 className="text-sm font-semibold text-gray-900">최근 질문</h3>
        </div>
        <div className="px-5 pb-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : !data?.recentQuestions.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">질문이 없습니다</div>
          ) : (
            data.recentQuestions.map(q => (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  q.is_resolved ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  <span className="text-sm">{q.is_resolved ? '✅' : '❓'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{q.body}</p>
                  <p className="text-xs text-gray-400">{q.file_name} · {q.author_name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  q.is_resolved
                    ? 'bg-green-50 text-green-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {q.is_resolved ? '해결' : '미해결'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
