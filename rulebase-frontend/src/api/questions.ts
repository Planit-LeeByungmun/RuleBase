import api from './axios';

export const questionsApi = {
  getByFile: (fileId: number) =>
    api.get('/questions', { params: { fileId } }),
  create: (data: { fileId: number; body: string }) =>
    api.post('/questions', data),
  createAnswer: (questionId: number, body: string) =>
    api.post(`/questions/${questionId}/answers`, { body }),
  resolve: (questionId: number) =>
    api.patch(`/questions/${questionId}/resolve`),
};
