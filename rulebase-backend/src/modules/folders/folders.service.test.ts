import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args), connect: () => mockConnect() },
}));

import * as foldersService from './folders.service';

beforeEach(() => {
  jest.clearAllMocks();
  mockConnect.mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [] });
});

describe('folders.service', () => {
  describe('getFolderTree', () => {
    it('returns all folders for admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [
        { id: 1, name: 'Root', parent_id: null, sort_order: 0 },
        { id: 2, name: 'Child', parent_id: 1, sort_order: 0 },
      ]});
      const result = await foldersService.getFolderTree(1, 'admin');
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });

    it('returns accessible folders for user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Visible', parent_id: null, sort_order: 0 }] });
      const result = await foldersService.getFolderTree(2, 'user');
      expect(result).toHaveLength(1);
    });
  });

  describe('createFolder', () => {
    it('creates and returns folder', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'New', parent_id: null, sort_order: 0 }] });
      const result = await foldersService.createFolder({ name: 'New', createdBy: 1 });
      expect(result.name).toBe('New');
    });
  });

  describe('updateFolder', () => {
    it('updates and returns folder', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Renamed' }] });
      const result = await foldersService.updateFolder(1, { name: 'Renamed' });
      expect(result.name).toBe('Renamed');
    });

    it('throws 400 when nothing to update', async () => {
      await expect(foldersService.updateFolder(1, {})).rejects.toThrow(AppError);
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(foldersService.updateFolder(999, { name: 'X' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteFolder', () => {
    it('deletes folder', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // SELECT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // DELETE
      await expect(foldersService.deleteFolder(1)).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(foldersService.deleteFolder(999)).rejects.toThrow(AppError);
    });
  });

  describe('reorderFolders', () => {
    it('reorders in transaction', async () => {
      await foldersService.reorderFolders([{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }]);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('fail')) // first update fails
        .mockResolvedValueOnce(undefined); // ROLLBACK
      await expect(foldersService.reorderFolders([{ id: 1, sortOrder: 0 }])).rejects.toThrow('fail');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('setFolderPermissions', () => {
    it('replaces permissions in transaction', async () => {
      await foldersService.setFolderPermissions(1, [{ userId: 2, canRead: true, canWrite: false }]);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getFolderPermissions', () => {
    it('returns permissions', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 2, can_read: true }] });
      const result = await foldersService.getFolderPermissions(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getEffectivePermission', () => {
    it('returns default when no permissions found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await foldersService.getEffectivePermission(1, 2);
      expect(result).toEqual({ canRead: true, canWrite: false });
    });

    it('returns found permission', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ can_read: true, can_write: true }] });
      const result = await foldersService.getEffectivePermission(1, 2);
      expect(result).toEqual({ canRead: true, canWrite: true });
    });
  });
});
