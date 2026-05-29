import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { post: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { authApi } from './auth';

beforeEach(() => vi.clearAllMocks());

describe('authApi', () => {
  it('register posts to /auth/register', () => {
    const data = { email: 'a@b.com', username: 'u', displayName: 'U', password: 'p' };
    authApi.register(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/register', data);
  });

  it('login posts to /auth/login', () => {
    const data = { email: 'a@b.com', password: 'p' };
    authApi.login(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', data);
  });

  it('requestPasswordReset posts email', () => {
    authApi.requestPasswordReset('a@b.com');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/request-password-reset', { email: 'a@b.com' });
  });

  it('resetPassword posts token and passwords', () => {
    const data = { token: 'tok', newPassword: 'new', confirmPassword: 'new' };
    authApi.resetPassword(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/reset-password', data);
  });
});
