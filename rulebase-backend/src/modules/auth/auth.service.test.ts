import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args), connect: () => mockConnect() },
}));

jest.mock('../notifications/notifications.service', () => ({
  sendRegistrationPending: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
}));

import * as authService from './auth.service';

beforeEach(() => {
  jest.clearAllMocks();
  mockConnect.mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [] });
});

describe('auth.service', () => {
  describe('register', () => {
    it('throws 409 if email/username exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      await expect(authService.register({
        email: 'a@b.com', username: 'user', displayName: 'U', password: 'Pass1!aa',
      })).rejects.toThrow(AppError);
    });

    it('creates user and returns data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no existing
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', username: 'user', display_name: 'U', status: 'pending' }] });
      const result = await authService.register({
        email: 'a@b.com', username: 'user', displayName: 'U', password: 'Pass1!aa',
      });
      expect(result.email).toBe('a@b.com');
      expect(result.status).toBe('pending');
    });
  });

  describe('login', () => {
    it('throws 401 for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(authService.login('a@b.com', 'pass')).rejects.toThrow(AppError);
    });

    it('throws 403 for pending user', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Pass1!aa', 1);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'a@b.com', username: 'u', display_name: 'U', password_hash: hash, role: 'user', status: 'pending' }],
      });
      await expect(authService.login('a@b.com', 'Pass1!aa')).rejects.toThrow(AppError);
    });

    it('returns token and user for valid login', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Pass1!aa', 1);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'a@b.com', username: 'u', display_name: 'U', password_hash: hash, role: 'user', status: 'approved' }],
      });
      const result = await authService.login('a@b.com', 'Pass1!aa');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('a@b.com');
    });
  });

  describe('requestPasswordReset', () => {
    it('returns sent:false if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await authService.requestPasswordReset('no@user.com');
      expect(result.sent).toBe(false);
    });

    it('creates token and returns sent:true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', display_name: 'U' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // insert token
      const result = await authService.requestPasswordReset('a@b.com');
      expect(result.sent).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('throws for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(authService.resetPassword('bad', 'NewPass1!')).rejects.toThrow(AppError);
    });

    it('throws for used token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, expires_at: new Date(Date.now() + 60000), used: true }] });
      await expect(authService.resetPassword('tok', 'NewPass1!')).rejects.toThrow(AppError);
    });

    it('throws for expired token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, expires_at: new Date(Date.now() - 60000), used: false }] });
      await expect(authService.resetPassword('tok', 'NewPass1!')).rejects.toThrow(AppError);
    });

    it('resets password with valid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, expires_at: new Date(Date.now() + 60000), used: false }] });
      mockClient.query.mockResolvedValue({ rows: [] });
      await expect(authService.resetPassword('tok', 'NewPass1!')).resolves.toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
