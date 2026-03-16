import api from './axios';

export const foldersApi = {
  getTree: () => api.get('/folders/tree'),
  create: (data: { name: string; parentId?: number; sortOrder?: number }) =>
    api.post('/folders', data),
  update: (id: number, data: { name?: string; parentId?: number; sortOrder?: number }) =>
    api.patch(`/folders/${id}`, data),
  delete: (id: number) => api.delete(`/folders/${id}`),
  reorder: (items: { id: number; sortOrder: number }[]) =>
    api.put('/folders/reorder', { items }),
  getPermissions: (id: number) => api.get(`/folders/${id}/permissions`),
  setPermissions: (id: number, permissions: Array<{ userId: number | null; canRead: boolean; canWrite: boolean }>) =>
    api.put(`/folders/${id}/permissions`, { permissions }),
};
