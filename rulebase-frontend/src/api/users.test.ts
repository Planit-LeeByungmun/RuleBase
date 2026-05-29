import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { usersApi } from './users';

beforeEach(() => vi.clearAllMocks());

describe('usersApi', () => {
  it('getPending calls GET /users/pending', () => {
    usersApi.getPending();
    expect(mockApi.get).toHaveBeenCalledWith('/users/pending');
  });

  it('approve patches by id', () => {
    usersApi.approve(3);
    expect(mockApi.patch).toHaveBeenCalledWith('/users/3/approve');
  });

  it('reject patches by id', () => {
    usersApi.reject(3);
    expect(mockApi.patch).toHaveBeenCalledWith('/users/3/reject');
  });

  it('search calls GET /users/search with query param', () => {
    usersApi.search('john');
    expect(mockApi.get).toHaveBeenCalledWith('/users/search', { params: { q: 'john' } });
  });
});
