import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { inquiriesApi } from '../../api/inquiries';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import type { Inquiry, InquiryDetail } from '../../types';

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

interface FaqCategorySummary {
  id: number;
  name: string;
  item_count: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentFiles: RecentFile[];
  recentInquiries: any[];
  faqCategories: FaqCategorySummary[];
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

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function AnswerItem({ a, inquiryId, user, invalidateAll, isLastAnswer }: {
  a: InquiryDetail['answers'][0];
  inquiryId: number;
  user: { id: number; role: string } | null;
  invalidateAll: () => void;
  isLastAnswer: boolean;
}) {
  const addToast = useUiStore(s => s.addToast);
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [editBody, setEditBody] = useState('');
  const canManageAnswer = user?.id === a.answered_by || user?.role === 'admin';

  const updateAnswerMutation = useMutation({
    mutationFn: () => inquiriesApi.updateAnswer(inquiryId, a.id, editBody),
    onSuccess: () => {
      invalidateAll();
      setEditingAnswer(false);
      addToast('댓글이 수정되었습니다.', 'success');
    },
    onError: () => addToast('댓글 수정에 실패했습니다.', 'error'),
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: () => inquiriesApi.deleteAnswer(inquiryId, a.id),
    onSuccess: () => {
      invalidateAll();
      addToast('댓글이 삭제되었습니다.', 'success');
    },
    onError: () => addToast('댓글 삭제에 실패했습니다.', 'error'),
  });

  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
            {a.answerer_display_name.charAt(0)}
          </span>
          <span className="text-sm font-medium text-gray-800">{a.answerer_display_name}</span>
          <span className="text-xs text-gray-400">{formatDateTime(a.created_at)}</span>
        </div>
        {canManageAnswer && !editingAnswer && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditingAnswer(true); setEditBody(a.body); }}
              className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
            >
              수정
            </button>
            {isLastAnswer && (
              <button
                onClick={() => {
                  if (window.confirm('이 댓글을 삭제하시겠습니까?'))
                    deleteAnswerMutation.mutate();
                }}
                className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>
      {editingAnswer ? (
        <div className="ml-8">
          <textarea
            rows={3}
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingAnswer(false)}
              className="text-xs px-3 py-1.5 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => updateAnswerMutation.mutate()}
              disabled={!editBody.trim() || updateAnswerMutation.isPending}
              className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateAnswerMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ml-8">{a.body}</p>
      )}
    </div>
  );
}

function InquirySection() {
  const user = useAuthStore(s => s.user);
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [answerBody, setAnswerBody] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', body: '' });

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const res = await inquiriesApi.getAll();
      return res.data.data as Inquiry[];
    },
  });

  const { data: detail } = useQuery({
    queryKey: ['inquiries', selectedId],
    queryFn: async () => {
      const res = await inquiriesApi.getOne(selectedId!);
      return res.data.data as InquiryDetail;
    },
    enabled: !!selectedId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: () => inquiriesApi.create({ title: form.title, body: form.body }),
    onSuccess: () => {
      invalidateAll();
      setShowForm(false);
      setForm({ title: '', body: '' });
      addToast('질문이 등록되었습니다.', 'success');
    },
    onError: () => addToast('질문 등록에 실패했습니다.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () => inquiriesApi.update(selectedId!, { title: editForm.title, body: editForm.body }),
    onSuccess: () => {
      invalidateAll();
      setEditing(false);
      addToast('질문이 수정되었습니다.', 'success');
    },
    onError: () => addToast('수정에 실패했습니다.', 'error'),
  });

  const answerMutation = useMutation({
    mutationFn: () => inquiriesApi.createAnswer(selectedId!, answerBody),
    onSuccess: () => {
      invalidateAll();
      setAnswerBody('');
      addToast('댓글이 등록되었습니다.', 'success');
    },
    onError: () => addToast('댓글 등록에 실패했습니다.', 'error'),
  });

  const toggleResolveMutation = useMutation({
    mutationFn: (id: number) => inquiriesApi.toggleResolve(id),
    onSuccess: () => {
      invalidateAll();
    },
    onError: () => addToast('처리에 실패했습니다.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inquiriesApi.delete(id),
    onSuccess: () => {
      invalidateAll();
      setSelectedId(null);
      addToast('질문이 삭제되었습니다.', 'success');
    },
    onError: () => addToast('삭제에 실패했습니다.', 'error'),
  });

  // Detail view
  if (selectedId && detail) {
    const isOwner = user?.id === detail.asked_by;
    const isAdmin = user?.role === 'admin';
    const canManage = isOwner || isAdmin;
    const hasAnswers = detail.answers.length > 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => { setSelectedId(null); setEditing(false); }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← 목록
          </button>
          {canManage && !editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleResolveMutation.mutate(detail.id)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  detail.is_resolved
                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {detail.is_resolved ? '미해결 처리' : '해결 처리'}
              </button>
              <button
                onClick={() => { setEditing(true); setEditForm({ title: detail.title, body: detail.body }); }}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
              >
                수정
              </button>
              {!hasAnswers && (
                <button
                  onClick={() => {
                    if (window.confirm('이 질문을 삭제하시겠습니까?'))
                      deleteMutation.mutate(detail.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Original inquiry */}
          {editing ? (
            <div className="mb-6">
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              <textarea
                rows={4}
                value={editForm.body}
                onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs px-3 py-1.5 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={!editForm.title.trim() || !editForm.body.trim() || updateMutation.isPending}
                  className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {detail.is_resolved ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">해결됨</span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">미해결</span>
                )}
                <h3 className="text-base font-bold text-gray-900">{detail.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                  {detail.display_name.charAt(0)}
                </span>
                <span>{detail.display_name}</span>
                <span>·</span>
                <span>{formatDateTime(detail.created_at)}</span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                {detail.body}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">댓글 {detail.answers.length}개</h4>
            {detail.answers.length > 0 && (
              <div className="space-y-3 mb-4">
                {detail.answers.map((a, i) => (
                  <AnswerItem
                    key={a.id}
                    a={a}
                    inquiryId={detail.id}
                    user={user}
                    invalidateAll={invalidateAll}
                    isLastAnswer={i === detail.answers.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Comment form */}
            <div className="flex gap-3">
              <textarea
                rows={2}
                value={answerBody}
                onChange={e => setAnswerBody(e.target.value)}
                placeholder="댓글을 작성하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={() => answerMutation.mutate()}
                disabled={!answerBody.trim() || answerMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                {answerMutation.isPending ? '...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h3 className="text-sm font-semibold text-gray-900">사용자 질의</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          질문 작성
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="제목"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <textarea
            rows={3}
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="질문 내용을 작성하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowForm(false); setForm({ title: '', body: '' }); }}
              className="text-xs px-3 py-1.5 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.title.trim() || !form.body.trim() || createMutation.isPending}
              className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pb-4">
        {isLoading ? (
          <div className="space-y-2 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !inquiries?.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">질의가 없습니다</div>
        ) : (
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="text-left py-2 font-medium w-16">상태</th>
                <th className="text-left py-2 font-medium">제목</th>
                <th className="text-left py-2 font-medium w-24">작성자</th>
                <th className="text-left py-2 font-medium w-28">작성일</th>
                <th className="text-right py-2 font-medium w-16">댓글</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inquiries.map(inq => (
                <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5">
                    {inq.is_resolved ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">해결</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">미해결</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => setSelectedId(inq.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                      {inq.title}
                    </button>
                  </td>
                  <td className="py-2.5 text-xs text-gray-500">{inq.display_name}</td>
                  <td className="py-2.5 text-xs text-gray-400">{formatDate(inq.created_at)}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{inq.answer_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
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

      {/* User Inquiries - full CRUD */}
      <InquirySection />

      {/* FAQ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 flex items-center gap-2">
          <span className="text-base">💡</span>
          <h3 className="text-sm font-semibold text-gray-900">FAQ</h3>
        </div>
        <div className="px-5 pb-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : !data?.faqCategories.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">FAQ가 없습니다</div>
          ) : (
            data.faqCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-500 text-sm">📂</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 flex-shrink-0">
                  {cat.item_count}개 항목
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
