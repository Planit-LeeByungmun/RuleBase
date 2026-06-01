import { signToken, verifyToken, JwtPayload } from './jwt';

const mockPayload: JwtPayload = {
  id: 1,
  email: 'test@example.com',
  role: 'user',
  status: 'approved',
};

describe('jwt utils', () => {
  it('signs and verifies a token', () => {
    const token = signToken(mockPayload);
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(mockPayload.id);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
    expect(decoded.status).toBe(mockPayload.status);
  });

  it('throws on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('includes iat and exp in token', () => {
    const token = signToken(mockPayload);
    const decoded = verifyToken(token) as any;
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });
});
