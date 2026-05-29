import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { inquiriesApi } from './inquiries';

beforeEach(() => vi.clearAllMocks());

describe('inquiriesApi', () => {
  it('getAll calls GET /inquiries', () => {
    inquiriesApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/inquiries');
  });

  it('getOne calls GET /inquiries/:id', () => {
    inquiriesApi.getOne(3);
    expect(mockApi.get).toHaveBeenCalledWith('/inquiries/3');
  });

  it('create posts data', () => {
    inquiriesApi.create({ title: 'T', body: 'B' });
    expect(mockApi.post).toHaveBeenCalledWith('/inquiries', { title: 'T', body: 'B' });
  });

  it('update patches by id', () => {
    inquiriesApi.update(3, { title: 'T2' });
    expect(mockApi.patch).toHaveBeenCalledWith('/inquiries/3', { title: 'T2' });
  });

  it('createAnswer posts body', () => {
    inquiriesApi.createAnswer(3, 'answer text');
    expect(mockApi.post).toHaveBeenCalledWith('/inquiries/3/answers', { body: 'answer text' });
  });

  it('updateAnswer patches answer', () => {
    inquiriesApi.updateAnswer(3, 7, 'updated');
    expect(mockApi.patch).toHaveBeenCalledWith('/inquiries/3/answers/7', { body: 'updated' });
  });

  it('deleteAnswer deletes answer', () => {
    inquiriesApi.deleteAnswer(3, 7);
    expect(mockApi.delete).toHaveBeenCalledWith('/inquiries/3/answers/7');
  });

  it('toggleResolve patches resolve', () => {
    inquiriesApi.toggleResolve(3);
    expect(mockApi.patch).toHaveBeenCalledWith('/inquiries/3/resolve');
  });

  it('delete calls DELETE /inquiries/:id', () => {
    inquiriesApi.delete(3);
    expect(mockApi.delete).toHaveBeenCalledWith('/inquiries/3');
  });
});
