import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { faqApi } from './faq';

beforeEach(() => vi.clearAllMocks());

describe('faqApi', () => {
  it('getCategories calls GET /faq/categories', () => {
    faqApi.getCategories();
    expect(mockApi.get).toHaveBeenCalledWith('/faq/categories');
  });

  it('createCategory posts data', () => {
    faqApi.createCategory({ name: 'Cat', sortOrder: 1 });
    expect(mockApi.post).toHaveBeenCalledWith('/faq/categories', { name: 'Cat', sortOrder: 1 });
  });

  it('updateCategory patches by id', () => {
    faqApi.updateCategory(5, { name: 'Updated' });
    expect(mockApi.patch).toHaveBeenCalledWith('/faq/categories/5', { name: 'Updated' });
  });

  it('deleteCategory deletes by id', () => {
    faqApi.deleteCategory(5);
    expect(mockApi.delete).toHaveBeenCalledWith('/faq/categories/5');
  });

  it('createItem posts data', () => {
    const data = { categoryId: 1, question: 'Q', answer: 'A' };
    faqApi.createItem(data);
    expect(mockApi.post).toHaveBeenCalledWith('/faq/items', data);
  });

  it('updateItem patches by id', () => {
    faqApi.updateItem(3, { question: 'Q2' });
    expect(mockApi.patch).toHaveBeenCalledWith('/faq/items/3', { question: 'Q2' });
  });

  it('deleteItem deletes by id', () => {
    faqApi.deleteItem(3);
    expect(mockApi.delete).toHaveBeenCalledWith('/faq/items/3');
  });
});
