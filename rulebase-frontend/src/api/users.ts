import api from './axios';

export const usersApi = {
  getPending: () => api.get('/users/pending'),
  approve: (id: number) => api.patch(`/users/${id}/approve`),
  reject: (id: number) => api.patch(`/users/${id}/reject`),
  search: (q: string) => api.get('/users/search', { params: { q } }),
};
