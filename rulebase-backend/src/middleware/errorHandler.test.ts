import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { AppError } from '../shared/errors/AppError';

function mockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext: NextFunction = jest.fn();

describe('errorHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles AppError with correct status and message', () => {
    const res = mockRes();
    const err = new AppError('Not found', 404);
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Not found' });
  });

  it('handles unexpected error as 500', () => {
    const res = mockRes();
    const err = new Error('unexpected');
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Internal server error' });
  });

  it('logs AppError to console', () => {
    const res = mockRes();
    const err = new AppError('Bad request', 400);
    errorHandler(err, mockReq, res, mockNext);
    expect(console.error).toHaveBeenCalledWith('[AppError] 400: Bad request');
  });

  it('logs unexpected error to console', () => {
    const res = mockRes();
    const err = new Error('oops');
    errorHandler(err, mockReq, res, mockNext);
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', err);
  });
});
