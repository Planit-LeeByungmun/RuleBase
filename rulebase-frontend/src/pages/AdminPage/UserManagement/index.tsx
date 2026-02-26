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
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">승인 대기 사용자</h2>
      {isLoading && <p className="text-gray-400">로딩 중...</p>}
      {!isLoading && pendingUsers?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p>승인 대기 중인 사용자가 없습니다</p>
        </div>
      )}
      <div className="space-y-3">
        {pendingUsers?.map(user => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{user.display_name}</p>
              <p className="text-sm text-gray-500">@{user.username} · {user.email}</p>
              {user.department && <p className="text-xs text-gray-400">{user.department}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(user.created_at).toLocaleString('ko-KR')}</p>
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
    </div>
  );
}
