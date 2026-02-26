import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  status: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
