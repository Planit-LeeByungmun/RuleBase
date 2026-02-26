import api from './axios';

export const filesApi = {
  getByFolder: (folderId: number) =>
    api.get('/files', { params: { folderId } }),
  getAll: () => api.get('/files/all'),
  upload: (folderId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', String(folderId));
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDownloadUrl: (id: number) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'}/files/${id}/download`,
  getViewUrl: (id: number) => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'}/files/${id}/view`,
  delete: (id: number) => api.delete(`/files/${id}`),
};
