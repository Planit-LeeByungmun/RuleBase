import api from './axios';

export const faqApi = {
  getCategories: () => api.get('/faq/categories'),
  createCategory: (data: { name: string; sortOrder?: number }) =>
    api.post('/faq/categories', data),
  updateCategory: (id: number, data: { name?: string; sortOrder?: number }) =>
    api.patch(`/faq/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/faq/categories/${id}`),
  createItem: (data: { categoryId: number; question: string; answer: string; sortOrder?: number }) =>
    api.post('/faq/items', data),
  updateItem: (id: number, data: { question?: string; answer?: string; sortOrder?: number }) =>
    api.patch(`/faq/items/${id}`, data),
  deleteItem: (id: number) => api.delete(`/faq/items/${id}`),
};
