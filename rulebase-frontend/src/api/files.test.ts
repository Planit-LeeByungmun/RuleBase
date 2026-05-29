import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { filesApi } from './files';

beforeEach(() => vi.clearAllMocks());

describe('filesApi', () => {
  it('getByFolder calls GET /files with folderId param', () => {
    filesApi.getByFolder(10);
    expect(mockApi.get).toHaveBeenCalledWith('/files', { params: { folderId: 10 } });
  });

  it('getAll calls GET /files/all', () => {
    filesApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/files/all');
  });

  it('upload posts FormData with file and folderId', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    filesApi.upload(5, file);

    expect(mockApi.post).toHaveBeenCalledWith(
      '/files/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const formData: FormData = mockApi.post.mock.calls[0][1];
    expect(formData.get('file')).toBe(file);
    expect(formData.get('folderId')).toBe('5');
  });

  it('getDownloadUrl returns correct URL', () => {
    expect(filesApi.getDownloadUrl(42)).toBe('http://localhost:4000/api/v1/files/42/download');
  });

  it('getViewUrl returns correct URL', () => {
    expect(filesApi.getViewUrl(42)).toBe('http://localhost:4000/api/v1/files/42/view');
  });

  it('delete calls DELETE /files/:id', () => {
    filesApi.delete(7);
    expect(mockApi.delete).toHaveBeenCalledWith('/files/7');
  });
});
