import { describe, it, expect, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { dashboardApi } from './dashboard';

describe('dashboardApi', () => {
  it('getAll calls GET /dashboard', () => {
    dashboardApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/dashboard');
  });
});
