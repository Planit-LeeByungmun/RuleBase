import { AppError } from '../../shared/errors/AppError';

const mockQuery = jest.fn();

jest.mock('../../config/database', () => ({
  pool: { query: (...args: any[]) => mockQuery(...args) },
}));

jest.mock('../folders/folders.service', () => ({
  getEffectivePermission: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  unlinkSync: jest.fn(),
}));

import * as filesService from './files.service';
import { getEffectivePermission } from '../folders/folders.service';

const mockGetPerm = getEffectivePermission as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('files.service', () => {
  describe('getFilesInFolder', () => {
    it('returns files for admin without permission check', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, original_name: 'file.pdf' }] });
      const result = await filesService.getFilesInFolder(1, 1, 'admin');
      expect(result).toHaveLength(1);
      expect(mockGetPerm).not.toHaveBeenCalled();
    });

    it('checks permission for non-admin', async () => {
      mockGetPerm.mockResolvedValueOnce({ canRead: true, canWrite: false });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await filesService.getFilesInFolder(1, 2, 'user');
      expect(mockGetPerm).toHaveBeenCalledWith(1, 2);
    });

    it('throws 403 when user has no read access', async () => {
      mockGetPerm.mockResolvedValueOnce({ canRead: false, canWrite: false });
      await expect(filesService.getFilesInFolder(1, 2, 'user')).rejects.toThrow(AppError);
    });
  });

  describe('getAllFiles', () => {
    it('returns all files for admin', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const result = await filesService.getAllFiles(1, 'admin');
      expect(result).toHaveLength(1);
    });

    it('returns accessible files for user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const result = await filesService.getAllFiles(2, 'user');
      expect(result).toHaveLength(1);
    });
  });

  describe('uploadFile', () => {
    it('inserts and returns file', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, original_name: 'test.pdf' }] });
      const result = await filesService.uploadFile({
        folderId: 1, originalName: 'test.pdf', storedName: 'abc.pdf',
        mimeType: 'application/pdf', fileSize: 1000, uploadedBy: 1,
      });
      expect(result.original_name).toBe('test.pdf');
    });
  });

  describe('getFileById', () => {
    it('returns file', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const result = await filesService.getFileById(1);
      expect(result.id).toBe(1);
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(filesService.getFileById(999)).rejects.toThrow(AppError);
    });
  });

  describe('deleteFile', () => {
    it('deletes file from db', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ stored_name: 'abc.pdf' }] });
      await expect(filesService.deleteFile(1)).resolves.toBeUndefined();
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(filesService.deleteFile(999)).rejects.toThrow(AppError);
    });
  });
});
