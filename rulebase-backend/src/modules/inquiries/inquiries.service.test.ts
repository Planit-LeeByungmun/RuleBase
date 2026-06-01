import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

import * as inquiriesService from './inquiries.service';

beforeEach(() => jest.clearAllMocks());

describe('inquiries.service', () => {
  describe('getInquiries', () => {
    it('returns inquiries', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Q' }] });
      const result = await inquiriesService.getInquiries();
      expect(result).toHaveLength(1);
    });
  });

  describe('getInquiry', () => {
    it('returns inquiry with answers', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Q' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, body: 'A' }] });
      const result = await inquiriesService.getInquiry(1);
      expect(result.title).toBe('Q');
      expect(result.answers).toHaveLength(1);
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.getInquiry(999)).rejects.toThrow(AppError);
    });
  });

  describe('createInquiry', () => {
    it('creates and returns inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: 'T', body: 'B' }] });
      const result = await inquiriesService.createInquiry({ title: 'T', body: 'B', askedBy: 1 });
      expect(result.title).toBe('T');
    });
  });

  describe('createAnswer', () => {
    it('creates answer for existing inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // inquiry exists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, body: 'Answer' }] });
      const result = await inquiriesService.createAnswer({ inquiryId: 1, body: 'Answer', answeredBy: 2 });
      expect(result.body).toBe('Answer');
    });

    it('throws 404 for non-existent inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.createAnswer({ inquiryId: 999, body: 'A', answeredBy: 1 })).rejects.toThrow(AppError);
    });
  });

  describe('updateInquiry', () => {
    it('updates and returns inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, title: 'Updated' }] });
      const result = await inquiriesService.updateInquiry(1, { title: 'Updated' }, 1, 'user');
      expect(result.title).toBe('Updated');
    });

    it('throws 400 when nothing to update', async () => {
      await expect(inquiriesService.updateInquiry(1, {}, 1, 'user')).rejects.toThrow(AppError);
    });

    it('throws 404 when not found or not permitted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.updateInquiry(999, { title: 'X' }, 1, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('toggleResolve', () => {
    it('toggles and returns inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, is_resolved: true }] });
      const result = await inquiriesService.toggleResolve(1, 1, 'user');
      expect(result.is_resolved).toBe(true);
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.toggleResolve(999, 1, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('deleteAnswer', () => {
    it('deletes answer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await expect(inquiriesService.deleteAnswer(1, 1, 'user')).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.deleteAnswer(999, 1, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('updateAnswer', () => {
    it('updates and returns answer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, body: 'New' }] });
      const result = await inquiriesService.updateAnswer(1, 'New', 1, 'user');
      expect(result.body).toBe('New');
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.updateAnswer(999, 'X', 1, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('deleteInquiry', () => {
    it('deletes inquiry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await expect(inquiriesService.deleteInquiry(1, 1, 'user')).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(inquiriesService.deleteInquiry(999, 1, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('getAnswerCount', () => {
    it('returns count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 5 }] });
      const result = await inquiriesService.getAnswerCount(1);
      expect(result).toBe(5);
    });
  });
});
