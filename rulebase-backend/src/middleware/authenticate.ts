import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../shared/utils/jwt';
import { AppError } from '../shared/errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    throw new AppError('No token provided', 401);
  }
  try {
    const payload = verifyToken(token);
    if (payload.status !== 'approved') {
      throw new AppError('Account not approved', 403);
    }
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired token', 401);
  }
}
