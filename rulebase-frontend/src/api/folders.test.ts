import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { foldersApi } from './folders';

beforeEach(() => vi.clearAllMocks());

describe('foldersApi', () => {
  it('getTree calls GET /folders/tree', () => {
    foldersApi.getTree();
    expect(mockApi.get).toHaveBeenCalledWith('/folders/tree');
  });

  it('create posts folder data', () => {
    foldersApi.create({ name: 'New', parentId: 1 });
    expect(mockApi.post).toHaveBeenCalledWith('/folders', { name: 'New', parentId: 1 });
  });

  it('update patches by id', () => {
    foldersApi.update(3, { name: 'Renamed' });
    expect(mockApi.patch).toHaveBeenCalledWith('/folders/3', { name: 'Renamed' });
  });

  it('delete calls DELETE /folders/:id', () => {
    foldersApi.delete(3);
    expect(mockApi.delete).toHaveBeenCalledWith('/folders/3');
  });

  it('reorder puts items', () => {
    const items = [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }];
    foldersApi.reorder(items);
    expect(mockApi.put).toHaveBeenCalledWith('/folders/reorder', { items });
  });

  it('getPermissions calls GET /folders/:id/permissions', () => {
    foldersApi.getPermissions(5);
    expect(mockApi.get).toHaveBeenCalledWith('/folders/5/permissions');
  });

  it('setPermissions puts permissions', () => {
    const permissions = [{ userId: 1, canRead: true, canWrite: false }];
    foldersApi.setPermissions(5, permissions);
    expect(mockApi.put).toHaveBeenCalledWith('/folders/5/permissions', { permissions });
  });
});
