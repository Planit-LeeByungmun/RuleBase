import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import * as notificationService from '../notifications/notifications.service';

export async function getPendingUsers() {
  const result = await pool.query(
    `SELECT id, email, username, display_name, department, created_at
     FROM users WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return result.rows;
}

export async function approveUser(userId: number, adminId: number) {
  const result = await pool.query(
    `UPDATE users SET status = 'approved', approved_at = NOW(), approved_by = $2
     WHERE id = $1 AND status = 'pending'
     RETURNING id, email, display_name`,
    [userId, adminId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found or not in pending status', 404);
  }

  const user = result.rows[0];
  try {
    await notificationService.sendRegistrationApproved(user.email, user.display_name);
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  return user;
}

export async function rejectUser(userId: number) {
  const result = await pool.query(
    `UPDATE users SET status = 'rejected'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, email, display_name`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found or not in pending status', 404);
  }

  const user = result.rows[0];
  try {
    await notificationService.sendRegistrationRejected(user.email, user.display_name);
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  return user;
}

export async function searchUsers(query: string, excludeId?: number) {
  const result = await pool.query(
    `SELECT id, username, display_name, department
     FROM users
     WHERE status = 'approved'
       AND id != $2
       AND (username ILIKE $1 OR display_name ILIKE $1)
     LIMIT 10`,
    [`%${query}%`, excludeId || 0]
  );
  return result.rows;
}
