import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args), connect: () => mockConnect() },
}));

jest.mock('../notifications/notifications.service', () => ({
  sendMentionNotification: jest.fn().mockResolvedValue(undefined),
  sendReplyNotification: jest.fn().mockResolvedValue(undefined),
}));

import * as questionsService from './questions.service';

beforeEach(() => {
  jest.clearAllMocks();
  mockConnect.mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [] });
});

describe('questions.service', () => {
  describe('getQuestions', () => {
    it('returns questions for file', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, body: 'Q' }] });
      const result = await questionsService.getQuestions(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getUnresolvedCounts', () => {
    it('returns empty for empty fileIds', async () => {
      const result = await questionsService.getUnresolvedCounts([]);
      expect(result).toEqual([]);
    });

    it('returns counts', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ file_id: 1, unresolved_count: 3 }] });
      const result = await questionsService.getUnresolvedCounts([1, 2]);
      expect(result).toHaveLength(1);
    });
  });

  describe('createQuestion', () => {
    it('creates question without mentions', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, body: 'No mentions' }] }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT
      const result = await questionsService.createQuestion({ fileId: 1, askedBy: 1, body: 'No mentions' });
      expect(result.id).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('rolls back on error', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('fail'));
      await expect(questionsService.createQuestion({ fileId: 1, askedBy: 1, body: 'test' })).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('createAnswer', () => {
    it('creates answer for existing question', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, file_id: 1, asked_by: 1, original_name: 'f.pdf', asker_email: 'a@b.com', asker_name: 'A', replier_name: 'B' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, body: 'Answer' }] });
      const result = await questionsService.createAnswer({ questionId: 1, answeredBy: 2, body: 'Answer' });
      expect(result.body).toBe('Answer');
    });

    it('throws 404 for non-existent question', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(questionsService.createAnswer({ questionId: 999, answeredBy: 1, body: 'A' })).rejects.toThrow(AppError);
    });
  });

  describe('resolveQuestion', () => {
    it('resolves question', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, is_resolved: true }] });
      const result = await questionsService.resolveQuestion(1, 1, 'user');
      expect(result.is_resolved).toBe(true);
    });

    it('throws 404 when not found or no permission', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(questionsService.resolveQuestion(999, 1, 'user')).rejects.toThrow(AppError);
    });
  });
});
