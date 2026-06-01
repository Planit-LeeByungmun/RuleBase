import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authenticate';
import { signToken } from '../shared/utils/jwt';
import { AppError } from '../shared/errors/AppError';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    query: {},
    ...overrides,
  } as Request;
}

const mockRes = {} as Response;
const mockNext: NextFunction = jest.fn();

describe('authenticate', () => {
  const validPayload = { id: 1, email: 'test@example.com', role: 'user', status: 'approved' };

  it('sets req.user and calls next for valid Bearer token', () => {
    const token = signToken(validPayload);
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    authenticate(req, mockRes, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe(1);
    expect(mockNext).toHaveBeenCalled();
  });

  it('accepts token from query param', () => {
    const token = signToken(validPayload);
    const req = mockReq({ query: { token } });
    authenticate(req, mockRes, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user!.email).toBe('test@example.com');
  });

  it('throws 401 when no token provided', () => {
    const req = mockReq();
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(AppError);
    try { authenticate(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(401);
      expect(e.message).toBe('No token provided');
    }
  });

  it('throws 401 for invalid token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer invalid' } });
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(AppError);
    try { authenticate(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(401);
    }
  });

  it('throws 403 for non-approved account', () => {
    const token = signToken({ ...validPayload, status: 'pending' });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(AppError);
    try { authenticate(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(403);
      expect(e.message).toBe('Account not approved');
    }
  });
});
