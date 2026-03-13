import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/users';
import { useUiStore } from '../../../store/uiStore';
import type { PendingUser } from '../../../types';
import { Button } from '../../../components/ui/Button';

export function UserManagement() {
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      const res = await usersApi.getPending();
      return res.data.data as PendingUser[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => usersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      addToast('사용자가 승인되었습니다.', 'success');
    },
    onError: () => addToast('승인에 실패했습니다.', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => usersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      addToast('사용자가 반려되었습니다.', 'success');
    },
    onError: () => addToast('반려에 실패했습니다.', 'error'),
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-base">👤</span>
        <h2 className="text-sm font-semibold text-gray-900">승인 대기 사용자</h2>
        {!isLoading && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {pendingUsers?.length ?? 0}명
          </span>
        )}
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : pendingUsers?.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-gray-400 text-sm">승인 대기 중인 사용자가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingUsers?.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-500 text-sm font-bold">{user.display_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.display_name}</p>
                    <p className="text-xs text-gray-500">@{user.username} · {user.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {user.department && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{user.department}</span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveMutation.mutate(user.id)} loading={approveMutation.isPending}>
                    승인
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => rejectMutation.mutate(user.id)} loading={rejectMutation.isPending}>
                    반려
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
