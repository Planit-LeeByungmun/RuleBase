import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from './validateRequest';
import { AppError } from '../shared/errors/AppError';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive'),
});

function mockReq(body: any): Request {
  return { body } as Request;
}

const mockRes = {} as Response;
const mockNext: NextFunction = jest.fn();

describe('validateRequest', () => {
  it('calls next and sets parsed body for valid data', () => {
    const middleware = validateRequest(schema);
    const req = mockReq({ name: 'Alice', age: 25 });
    middleware(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice', age: 25 });
  });

  it('strips unknown fields', () => {
    const middleware = validateRequest(schema);
    const req = mockReq({ name: 'Alice', age: 25, extra: 'field' });
    middleware(req, mockRes, mockNext);
    expect(req.body.extra).toBeUndefined();
  });

  it('throws 400 AppError for invalid data', () => {
    const middleware = validateRequest(schema);
    const req = mockReq({ name: '', age: -1 });
    expect(() => middleware(req, mockRes, mockNext)).toThrow(AppError);
    try { middleware(req, mockRes, mockNext); } catch (e: any) {
      expect(e.statusCode).toBe(400);
    }
  });

  it('throws 400 for missing required fields', () => {
    const middleware = validateRequest(schema);
    const req = mockReq({});
    expect(() => middleware(req, mockRes, mockNext)).toThrow(AppError);
  });
});
