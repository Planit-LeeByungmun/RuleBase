import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { inquiriesApi } from '../../api/inquiries';
import { faqApi } from '../../api/faq';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useFolderStore } from '../../store/folderStore';
import type { Inquiry, InquiryDetail, FaqCategory } from '../../types';

interface DashboardStats {
  total_files: number;
  total_folders: number;
  unresolved_inquiries: number;
  total_faq_items: number;
}

interface RecentFile {
  id: number;
  original_name: string;
  folder_id: number;
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
  { key: 'unresolved_inquiries' as const, label: '미해결 질의', icon: '❓', gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-600' },
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

type SearchFilter = 'title' | 'body' | 'title+body' | 'user';
const searchFilterLabels: Record<SearchFilter, string> = {
  'title': '제목',
  'body': '내용',
  'title+body': '제목+내용',
  'user': '작성자',
};

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function SearchResultItem({ inquiry, keyword, onSelect }: {
  inquiry: Inquiry;
  keyword: string;
  onSelect: (id: number) => void;
}) {
  const { data: detail } = useQuery({
    queryKey: ['inquiries', inquiry.id],
    queryFn: async () => {
      const res = await inquiriesApi.getOne(inquiry.id);
      return res.data.data as InquiryDetail;
    },
  });

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Inquiry header */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {inquiry.is_resolved ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">해결</span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">미해결</span>
          )}
          <button
            onClick={() => onSelect(inquiry.id)}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            <HighlightText text={inquiry.title} keyword={keyword} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span><HighlightText text={inquiry.display_name} keyword={keyword} /></span>
          <span>·</span>
          <span>{formatDateTime(inquiry.created_at)}</span>
        </div>
      </div>
      {/* Inquiry body */}
      <div className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-b border-gray-100">
        <HighlightText text={inquiry.body} keyword={keyword} />
      </div>
      {/* Answers */}
      {detail?.answers && detail.answers.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {detail.answers.map(a => (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                  {a.answerer_display_name.charAt(0)}
                </span>
                <span className="text-xs font-medium text-gray-700">{a.answerer_display_name}</span>
                <span className="text-xs text-gray-400">{formatDateTime(a.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed ml-7">
                <HighlightText text={a.body} keyword={keyword} />
              </p>
            </div>
          ))}
        </div>
      ) : detail ? (
        <div className="px-4 py-3 text-xs text-gray-400">댓글 없음</div>
      ) : (
        <div className="px-4 py-3">
          <div className="h-6 bg-gray-100 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}

function SearchResultModal({ keyword, filter, inquiries, page, pageSize, onPageChange, onClose, onSelect }: {
  keyword: string;
  filter: SearchFilter;
  inquiries: Inquiry[];
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const kw = keyword.toLowerCase();
  const filtered = useMemo(() =>
    inquiries.filter(inq => {
      switch (filter) {
        case 'title': return inq.title.toLowerCase().includes(kw);
        case 'body': return inq.body.toLowerCase().includes(kw);
        case 'title+body': return inq.title.toLowerCase().includes(kw) || inq.body.toLowerCase().includes(kw);
        case 'user': return inq.display_name.toLowerCase().includes(kw);
      }
    }), [inquiries, filter, kw]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">검색 결과</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
              {filtered.length}건
            </span>
            <span className="text-xs text-gray-400">
              &quot;{keyword}&quot; · {searchFilterLabels[filter]}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">검색 결과가 없습니다</div>
          ) : (
            paged.map(inq => (
              <SearchResultItem key={inq.id} inquiry={inq} keyword={keyword} onSelect={onSelect} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2 py-1 text-xs text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ‹ 이전
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`w-7 h-7 text-xs rounded transition-colors ${
                  page === i + 1
                    ? 'bg-blue-500 text-white font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2 py-1 text-xs text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음 ›
            </button>
          </div>
        )}
      </div>
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
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('title+body');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const SEARCH_PAGE_SIZE = 5;

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
          질의 작성
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

      {/* Search bar */}
      <div className="px-5 pt-3">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (searchKeyword.trim()) {
              setSearchSubmitted(searchKeyword.trim());
              setSearchPage(1);
            }
          }}
          className="flex items-center gap-2"
        >
          <select
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value as SearchFilter)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {(Object.keys(searchFilterLabels) as SearchFilter[]).map(key => (
              <option key={key} value={key}>{searchFilterLabels[key]}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => { setSearchKeyword(''); setSearchSubmitted(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!searchKeyword.trim()}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {/* Search Result Modal */}
      {searchSubmitted && (
        <SearchResultModal
          keyword={searchSubmitted}
          filter={searchFilter}
          inquiries={inquiries ?? []}
          page={searchPage}
          pageSize={SEARCH_PAGE_SIZE}
          onPageChange={setSearchPage}
          onClose={() => { setSearchSubmitted(''); setSearchKeyword(''); }}
          onSelect={(id) => { setSearchSubmitted(''); setSearchKeyword(''); setSelectedId(id); }}
        />
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
                <th className="text-left py-2 font-medium w-36">작성일시</th>
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
                  <td className="py-2.5 text-xs text-gray-400">{formatDateTime(inq.created_at)}</td>
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

const SCROLL_ITEM_HEIGHT = 56; // approx height of each file row
const VISIBLE_COUNT = 3;
const CONTAINER_HEIGHT = SCROLL_ITEM_HEIGHT * VISIBLE_COUNT;

function RecentFilesCard({ files, isLoading }: { files: RecentFile[]; isLoading: boolean }) {
  const navigate = useNavigate();
  const { setSelectedFolder, setSelectedFile, toggleFolder, expandedFolderIds } = useFolderStore();
  const oneWeekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);
  const recentFiles = useMemo(() => files.filter(f => new Date(f.created_at) >= oneWeekAgo), [files, oneWeekAgo]);
  const needsScroll = recentFiles.length > VISIBLE_COUNT;
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!needsScroll || !scrollRef.current) return;
    setAnimDone(false);
    const el = scrollRef.current;
    let animId: number;
    let start: number | null = null;
    const totalHeight = el.scrollHeight / 2;
    const speed = 30;

    let elapsedTotal = 0;
    let prevTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (pausedRef.current) {
        animId = requestAnimationFrame(step);
        start = null;
        prevTimestamp = null;
        return;
      }
      if (start === null) start = timestamp;
      if (prevTimestamp !== null) {
        elapsedTotal += timestamp - prevTimestamp;
      }
      prevTimestamp = timestamp;

      if (elapsedTotal >= 5000) {
        el.scrollTop = 0;
        setAnimDone(true);
        return;
      }

      const elapsed = (timestamp - start) / 1000;
      const pos = (elapsed * speed) % totalHeight;
      el.scrollTop = pos;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [needsScroll, recentFiles]);

  const handleFileClick = useCallback((file: RecentFile) => {
    pausedRef.current = true;
    setAnimDone(true);
    if (!expandedFolderIds.has(file.folder_id)) {
      toggleFolder(file.folder_id);
    }
    setSelectedFolder(file.folder_id);
    setSelectedFile(file.id);
    navigate('/documents');
  }, [expandedFolderIds, toggleFolder, setSelectedFolder, setSelectedFile, navigate]);

  const fileItems = (list: RecentFile[]) =>
    list.map((file, i) => (
      <div
        key={`${file.id}-${i}`}
        onClick={() => handleFileClick(file)}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-500 text-sm">📋</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-700 truncate hover:underline">{file.original_name}</p>
          <p className="text-xs text-gray-400">{file.folder_name} · {file.uploader_name}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(file.created_at)}</span>
      </div>
    ));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 flex items-center gap-2">
        <span className="text-base">📄</span>
        <h3 className="text-sm font-semibold text-gray-900">
          최근 업로드된 파일
          {!isLoading && (
            <span className="text-xs font-medium text-gray-400 ml-1">({recentFiles.length})</span>
          )}
        </h3>
      </div>
      <div className="px-5 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !recentFiles.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">최근 일주일 내 업로드된 파일이 없습니다</div>
        ) : needsScroll ? (
          animDone ? (
            <div
              className="overflow-y-auto space-y-2"
              style={{ maxHeight: CONTAINER_HEIGHT }}
            >
              {fileItems(recentFiles)}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="overflow-hidden"
              style={{ height: CONTAINER_HEIGHT }}
            >
              <div className="space-y-2">
                {fileItems(recentFiles)}
                {fileItems(recentFiles)}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {fileItems(recentFiles)}
          </div>
        )}
      </div>
    </div>
  );
}

function FaqAccordionItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg transition-all ${open ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          open ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {index + 1}
        </span>
        <span className={`flex-1 text-sm font-medium ${open ? 'text-violet-700' : 'text-gray-800'}`}>{question}</span>
        <span className={`text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180 text-violet-500' : 'text-gray-300'}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 ml-9">
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-3 border border-violet-100">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}

function FaqSection({ isLoading, categorySummaries }: { isLoading: boolean; categorySummaries?: FaqCategorySummary[] }) {
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['faq', 'categories'],
    queryFn: async () => {
      const res = await faqApi.getCategories();
      return res.data.data as FaqCategory[];
    },
  });

  const toggleCategory = (id: number) => {
    setExpandedCategoryId(prev => (prev === id ? null : id));
  };

  return (
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
        ) : !categorySummaries?.length ? (
          <div className="py-8 text-center text-gray-400 text-sm">FAQ가 없습니다</div>
        ) : (
          categorySummaries.map(cat => {
            const isExpanded = expandedCategoryId === cat.id;
            const fullCategory = categories?.find(c => c.id === cat.id);
            return (
              <div key={cat.id} className={`rounded-xl border transition-all ${isExpanded ? 'border-violet-200 shadow-sm' : 'border-gray-100'}`}>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isExpanded ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-500 text-sm">📂</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm font-medium ${isExpanded ? 'text-violet-700' : 'text-gray-900'}`}>{cat.name}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 flex-shrink-0">
                    {cat.item_count}개 항목
                  </span>
                  <span className={`text-xs text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180 text-violet-500' : ''}`}>
                    ▼
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3">
                    {!fullCategory ? (
                      <div className="py-4 text-center">
                        <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                      </div>
                    ) : fullCategory.items.length === 0 ? (
                      <div className="py-4 text-center text-gray-400 text-xs">항목이 없습니다</div>
                    ) : (
                      <div className="space-y-0.5">
                        {fullCategory.items.map((item, i) => (
                          <FaqAccordionItem key={item.id} question={item.question} answer={item.answer} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
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

  const { data: inquiries } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const res = await inquiriesApi.getAll();
      return res.data.data as Inquiry[];
    },
  });

  const unresolvedCount = inquiries?.filter(i => !i.is_resolved).length ?? 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">대시보드</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
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
              ) : card.key === 'unresolved_inquiries' ? (
                unresolvedCount.toLocaleString()
              ) : (
                (data?.stats[card.key] ?? 0).toLocaleString()
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Files */}
      <RecentFilesCard files={data?.recentFiles ?? []} isLoading={isLoading} />

      {/* User Inquiries - full CRUD */}
      <InquirySection />

      {/* FAQ */}
      <FaqSection isLoading={isLoading} categorySummaries={data?.faqCategories} />
    </div>
  );
}
