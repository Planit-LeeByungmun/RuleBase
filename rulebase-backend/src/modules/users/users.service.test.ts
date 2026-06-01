import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

jest.mock('../notifications/notifications.service', () => ({
  sendRegistrationApproved: jest.fn().mockResolvedValue(undefined),
  sendRegistrationRejected: jest.fn().mockResolvedValue(undefined),
}));

import * as usersService from './users.service';

beforeEach(() => jest.clearAllMocks());

describe('users.service', () => {
  describe('getPendingUsers', () => {
    it('returns pending users', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'pending' }] });
      const result = await usersService.getPendingUsers();
      expect(result).toHaveLength(1);
    });
  });

  describe('approveUser', () => {
    it('approves user and returns data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', display_name: 'U' }] });
      const result = await usersService.approveUser(1, 99);
      expect(result.id).toBe(1);
    });

    it('throws 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(usersService.approveUser(999, 99)).rejects.toThrow(AppError);
    });
  });

  describe('rejectUser', () => {
    it('rejects user and returns data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', display_name: 'U' }] });
      const result = await usersService.rejectUser(1);
      expect(result.id).toBe(1);
    });

    it('throws 404 if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(usersService.rejectUser(999)).rejects.toThrow(AppError);
    });
  });

  describe('searchUsers', () => {
    it('returns matching users', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, username: 'john' }] });
      const result = await usersService.searchUsers('john', 1);
      expect(result).toHaveLength(1);
    });
  });
});
