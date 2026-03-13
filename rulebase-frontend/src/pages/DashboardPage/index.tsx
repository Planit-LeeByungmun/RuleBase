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
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">최근 업로드된 파일</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">파일명</th>
                <th className="px-4 py-2 font-medium">폴더</th>
                <th className="px-4 py-2 font-medium">업로더</th>
                <th className="px-4 py-2 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">로딩 중...</td></tr>
              ) : !data?.recentFiles.length ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">파일이 없습니다</td></tr>
              ) : (
                data.recentFiles.map(file => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900 truncate max-w-[150px]">{file.original_name}</td>
                    <td className="px-4 py-2 text-gray-600 truncate max-w-[100px]">{file.folder_name}</td>
                    <td className="px-4 py-2 text-gray-600">{file.uploader_name}</td>
                    <td className="px-4 py-2 text-gray-500">{formatDate(file.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Questions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">최근 질문</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">질문</th>
                <th className="px-4 py-2 font-medium">파일</th>
                <th className="px-4 py-2 font-medium">작성자</th>
                <th className="px-4 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">로딩 중...</td></tr>
              ) : !data?.recentQuestions.length ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">질문이 없습니다</td></tr>
              ) : (
                data.recentQuestions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 truncate max-w-[150px]">{q.body}</td>
                    <td className="px-4 py-2 text-gray-600 truncate max-w-[100px]">{q.file_name}</td>
                    <td className="px-4 py-2 text-gray-600">{q.author_name}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        q.is_resolved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {q.is_resolved ? '해결' : '미해결'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
