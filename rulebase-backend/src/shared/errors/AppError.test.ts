import { AppError } from './AppError';

describe('AppError', () => {
  it('creates error with message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('defaults isOperational to true', () => {
    const err = new AppError('fail', 500);
    expect(err.isOperational).toBe(true);
  });

  it('allows setting isOperational to false', () => {
    const err = new AppError('fail', 500, false);
    expect(err.isOperational).toBe(false);
  });

  it('is an instance of Error', () => {
    const err = new AppError('test', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('has a stack trace', () => {
    const err = new AppError('test', 400);
    expect(err.stack).toBeDefined();
  });
});
