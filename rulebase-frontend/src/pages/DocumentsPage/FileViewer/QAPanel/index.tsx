import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../../api/questions';
import { useAuth } from '../../../../hooks/useAuth';
import { useUiStore } from '../../../../store/uiStore';
import type { Question } from '../../../../types';
import { MentionInput } from './MentionInput';
import { Button } from '../../../../components/ui/Button';

interface Props {
  fileId: number;
}

export function QAPanel({ fileId }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const { user } = useAuth();
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', fileId],
    queryFn: async () => {
      const res = await questionsApi.getByFile(fileId);
      return res.data.data as Question[];
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: () => questionsApi.create({ fileId, body: newQuestion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', fileId] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'unresolved-counts'] });
      setNewQuestion('');
      addToast('질의가 등록되었습니다.', 'success');
    },
    onError: () => addToast('질의 등록에 실패했습니다.', 'error'),
  });

  const createAnswerMutation = useMutation({
    mutationFn: (questionId: number) => questionsApi.createAnswer(questionId, replyBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', fileId] });
      setReplyingTo(null);
      setReplyBody('');
      addToast('답글이 등록되었습니다.', 'success');
    },
    onError: () => addToast('답글 등록에 실패했습니다.', 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: (questionId: number) => questionsApi.resolve(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', fileId] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'unresolved-counts'] });
    },
  });

  return (
    <div className="w-full bg-white flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">Q&A ({questions?.length || 0})</h3>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-gray-600 text-xs">
          {isCollapsed ? '펼치기' : '접기'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isLoading && <p className="text-sm text-gray-400">로딩 중...</p>}
            {questions?.length === 0 && !isLoading && (
              <p className="text-sm text-gray-400 text-center py-4">질의가 없습니다</p>
            )}
            {questions?.map(q => (
              <div key={q.id} className={`rounded-lg p-3 ${q.is_resolved ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600">@{q.display_name}</span>
                  {q.is_resolved && <span className="text-xs text-green-600 font-medium">✓ 해결됨</span>}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.body}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(q.created_at).toLocaleString('ko-KR')}</p>

                {q.answers.map(a => (
                  <div key={a.id} className="mt-2 ml-3 pl-3 border-l-2 border-blue-200">
                    <span className="text-xs font-medium text-gray-600">@{a.answerer_display_name}</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.body}</p>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setReplyingTo(replyingTo === q.id ? null : q.id); setReplyBody(''); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    답글
                  </button>
                  {!q.is_resolved && q.asker_id === user?.id && (
                    <button
                      onClick={() => resolveMutation.mutate(q.id)}
                      className="text-xs text-green-600 hover:underline"
                    >
                      해결완료
                    </button>
                  )}
                </div>

                {replyingTo === q.id && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="답글을 입력하세요..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => createAnswerMutation.mutate(q.id)} loading={createAnswerMutation.isPending}>
                        등록
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t">
            <MentionInput
              value={newQuestion}
              onChange={setNewQuestion}
              placeholder="질의를 입력하세요... (@사용자명으로 멘션)"
            />
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={() => createQuestionMutation.mutate()}
              loading={createQuestionMutation.isPending}
              disabled={!newQuestion.trim()}
            >
              질의 등록
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
