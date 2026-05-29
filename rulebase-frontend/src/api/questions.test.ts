import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock('./axios', () => ({ default: mockApi }));

import { questionsApi } from './questions';

beforeEach(() => vi.clearAllMocks());

describe('questionsApi', () => {
  it('getByFile calls GET /questions with fileId param', () => {
    questionsApi.getByFile(10);
    expect(mockApi.get).toHaveBeenCalledWith('/questions', { params: { fileId: 10 } });
  });

  it('getUnresolvedCounts calls GET with comma-joined fileIds', () => {
    questionsApi.getUnresolvedCounts([1, 2, 3]);
    expect(mockApi.get).toHaveBeenCalledWith('/questions/unresolved-counts', { params: { fileIds: '1,2,3' } });
  });

  it('create posts question data', () => {
    questionsApi.create({ fileId: 1, body: 'Why?' });
    expect(mockApi.post).toHaveBeenCalledWith('/questions', { fileId: 1, body: 'Why?' });
  });

  it('createAnswer posts answer body', () => {
    questionsApi.createAnswer(5, 'Because');
    expect(mockApi.post).toHaveBeenCalledWith('/questions/5/answers', { body: 'Because' });
  });

  it('resolve patches question', () => {
    questionsApi.resolve(5);
    expect(mockApi.patch).toHaveBeenCalledWith('/questions/5/resolve');
  });
});
