import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import * as faqService from './faq.service';

beforeEach(() => jest.clearAllMocks());

describe('faq.service', () => {
  describe('getCategoriesWithItems', () => {
    it('returns categories', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Cat', items: [] }] });
      const result = await faqService.getCategoriesWithItems();
      expect(result).toHaveLength(1);
    });
  });

  describe('createCategory', () => {
    it('creates and returns category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'New' }] });
      const result = await faqService.createCategory({ name: 'New', createdBy: 1 });
      expect(result.name).toBe('New');
    });
  });

  describe('updateCategory', () => {
    it('updates and returns category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated' }] });
      const result = await faqService.updateCategory(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('throws 400 when nothing to update', async () => {
      await expect(faqService.updateCategory(1, {})).rejects.toThrow(AppError);
    });

    it('throws 404 when category not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(faqService.updateCategory(999, { name: 'X' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteCategory', () => {
    it('deletes category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await expect(faqService.deleteCategory(1)).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(faqService.deleteCategory(999)).rejects.toThrow(AppError);
    });
  });

  describe('createItem', () => {
    it('creates and returns item', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, question: 'Q' }] });
      const result = await faqService.createItem({ categoryId: 1, question: 'Q', answer: 'A', createdBy: 1 });
      expect(result.question).toBe('Q');
    });
  });

  describe('updateItem', () => {
    it('updates and returns item', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, question: 'Q2' }] });
      const result = await faqService.updateItem(1, { question: 'Q2' });
      expect(result.question).toBe('Q2');
    });

    it('throws 400 when nothing to update', async () => {
      await expect(faqService.updateItem(1, {})).rejects.toThrow(AppError);
    });

    it('throws 404 when item not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(faqService.updateItem(999, { question: 'X' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteItem', () => {
    it('deletes item', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await expect(faqService.deleteItem(1)).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(faqService.deleteItem(999)).rejects.toThrow(AppError);
    });
  });
});
