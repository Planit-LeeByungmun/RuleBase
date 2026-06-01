import { Request, Response, NextFunction } from 'express';
import { authorize } from './authorize';
import { AppError } from '../shared/errors/AppError';

function mockReq(user?: any): Request {
  return { user } as Request;
}

const mockRes = {} as Response;
const mockNext: NextFunction = jest.fn();

describe('authorize', () => {
  it('calls next when user has allowed role', () => {
    const middleware = authorize('admin', 'user');
    const req = mockReq({ id: 1, role: 'admin' });
    middleware(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('throws 403 when user role not in allowed list', () => {
    const middleware = authorize('admin');
    const req = mockReq({ id: 1, role: 'user' });
    expect(() => middleware(req, mockRes, mockNext)).toThrow(AppError);
    try { middleware(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(403);
      expect(e.message).toBe('Insufficient permissions');
    }
  });

  it('throws 401 when no user on request', () => {
    const middleware = authorize('admin');
    const req = mockReq(undefined);
    expect(() => middleware(req, mockRes, mockNext)).toThrow(AppError);
    try { middleware(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(401);
    }
  });
});
