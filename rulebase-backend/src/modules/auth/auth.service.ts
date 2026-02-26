import { pool } from '../../config/database';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { signToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import crypto from 'crypto';
import * as notificationService from '../notifications/notifications.service';

export async function register(data: {
  email: string;
  username: string;
  displayName: string;
  password: string;
  department?: string;
}) {
  const { email, username, displayName, password, department } = data;

  // Check existing
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  if (existing.rows.length > 0) {
    throw new AppError('Email or username already exists', 409);
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (email, username, display_name, password_hash, role, status, department)
     VALUES ($1, $2, $3, $4, 'user', 'pending', $5) RETURNING id, email, username, display_name, status`,
    [email, username, displayName, passwordHash, department || null]
  );

  const user = result.rows[0];

  // Send notification to admin
  try {
    await notificationService.sendRegistrationPending(env.ADMIN_EMAIL, {
      username,
      email,
      displayName,
    });
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }

  return user;
}

export async function login(email: string, password: string) {
  const result = await pool.query(
    'SELECT id, email, username, display_name, password_hash, role, status FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'pending') {
    throw new AppError('Account is pending approval', 403);
  }
  if (user.status === 'rejected') {
    throw new AppError('Account has been rejected', 403);
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      status: user.status,
    },
  };
}

export async function requestPasswordReset(email: string) {
  const result = await pool.query(
    'SELECT id, email, display_name FROM users WHERE email = $1 AND status = $2',
    [email, 'approved']
  );

  if (result.rows.length === 0) {
    // Don't reveal whether user exists
    return;
  }

  const user = result.rows[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  try {
    await notificationService.sendPasswordReset(user.email, user.display_name, token);
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const result = await pool.query(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
     FROM password_reset_tokens prt
     WHERE prt.token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired token', 400);
  }

  const resetToken = result.rows[0];

  if (resetToken.used) {
    throw new AppError('Token has already been used', 400);
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    throw new AppError('Token has expired', 400);
  }

  const passwordHash = await hashPassword(newPassword);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );
    await client.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [resetToken.id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
