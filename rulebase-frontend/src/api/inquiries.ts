import api from './axios';

export const inquiriesApi = {
  getAll: () => api.get('/inquiries'),
  getOne: (id: number) => api.get(`/inquiries/${id}`),
  create: (data: { title: string; body: string }) =>
    api.post('/inquiries', data),
  update: (id: number, data: { title?: string; body?: string }) =>
    api.patch(`/inquiries/${id}`, data),
  createAnswer: (inquiryId: number, body: string) =>
    api.post(`/inquiries/${inquiryId}/answers`, { body }),
  updateAnswer: (inquiryId: number, answerId: number, body: string) =>
    api.patch(`/inquiries/${inquiryId}/answers/${answerId}`, { body }),
  deleteAnswer: (inquiryId: number, answerId: number) =>
    api.delete(`/inquiries/${inquiryId}/answers/${answerId}`),
  toggleResolve: (id: number) => api.patch(`/inquiries/${id}/resolve`),
  delete: (id: number) => api.delete(`/inquiries/${id}`),
};
