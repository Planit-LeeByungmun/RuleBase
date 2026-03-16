import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export async function getInquiries() {
  const result = await pool.query(
    `SELECT i.id, i.title, i.body, i.is_resolved, i.created_at,
            i.asked_by, u.username, u.display_name,
            COUNT(ia.id)::int as answer_count
     FROM inquiries i
     INNER JOIN users u ON i.asked_by = u.id
     LEFT JOIN inquiry_answers ia ON ia.inquiry_id = i.id
     GROUP BY i.id, u.id, u.username, u.display_name
     ORDER BY i.created_at DESC`
  );
  return result.rows;
}

export async function getInquiry(id: number) {
  const inquiryResult = await pool.query(
    `SELECT i.id, i.title, i.body, i.is_resolved, i.created_at,
            i.asked_by, u.username, u.display_name
     FROM inquiries i
     INNER JOIN users u ON i.asked_by = u.id
     WHERE i.id = $1`,
    [id]
  );

  if (inquiryResult.rows.length === 0) {
    throw new AppError('Inquiry not found', 404);
  }

  const answersResult = await pool.query(
    `SELECT ia.id, ia.body, ia.created_at,
            ia.answered_by, u.username as answerer_username, u.display_name as answerer_display_name
     FROM inquiry_answers ia
     INNER JOIN users u ON ia.answered_by = u.id
     WHERE ia.inquiry_id = $1
     ORDER BY ia.created_at ASC`,
    [id]
  );

  return { ...inquiryResult.rows[0], answers: answersResult.rows };
}

export async function createInquiry(data: { title: string; body: string; askedBy: number }) {
  const result = await pool.query(
    `INSERT INTO inquiries (title, body, asked_by) VALUES ($1, $2, $3) RETURNING *`,
    [data.title, data.body, data.askedBy]
  );
  return result.rows[0];
}

export async function createAnswer(data: { inquiryId: number; body: string; answeredBy: number }) {
  const inquiry = await pool.query('SELECT id FROM inquiries WHERE id = $1', [data.inquiryId]);
  if (inquiry.rows.length === 0) {
    throw new AppError('Inquiry not found', 404);
  }

  const result = await pool.query(
    `INSERT INTO inquiry_answers (inquiry_id, body, answered_by) VALUES ($1, $2, $3) RETURNING *`,
    [data.inquiryId, data.body, data.answeredBy]
  );
  return result.rows[0];
}

export async function updateInquiry(id: number, data: { title?: string; body?: string }, userId: number, userRole: string) {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.title !== undefined) { sets.push(`title = $${idx++}`); values.push(data.title); }
  if (data.body !== undefined) { sets.push(`body = $${idx++}`); values.push(data.body); }

  if (sets.length === 0) throw new AppError('Nothing to update', 400);

  values.push(id, userId, userRole);
  const result = await pool.query(
    `UPDATE inquiries SET ${sets.join(', ')}
     WHERE id = $${idx} AND (asked_by = $${idx + 1} OR $${idx + 2} = 'admin')
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Inquiry not found or permission denied', 404);
  }

  return result.rows[0];
}

export async function getAnswerCount(inquiryId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*)::int as count FROM inquiry_answers WHERE inquiry_id = $1',
    [inquiryId]
  );
  return result.rows[0].count;
}

export async function deleteAnswer(answerId: number, userId: number, userRole: string) {
  const result = await pool.query(
    `DELETE FROM inquiry_answers
     WHERE id = $1 AND (answered_by = $2 OR $3 = 'admin')
     RETURNING id`,
    [answerId, userId, userRole]
  );

  if (result.rows.length === 0) {
    throw new AppError('Answer not found or permission denied', 404);
  }
}

export async function toggleResolve(id: number, userId: number, userRole: string) {
  const result = await pool.query(
    `UPDATE inquiries SET is_resolved = NOT is_resolved
     WHERE id = $1 AND (asked_by = $2 OR $3 = 'admin')
     RETURNING *`,
    [id, userId, userRole]
  );

  if (result.rows.length === 0) {
    throw new AppError('Inquiry not found or permission denied', 404);
  }

  return result.rows[0];
}

export async function updateAnswer(answerId: number, body: string, userId: number, userRole: string) {
  const result = await pool.query(
    `UPDATE inquiry_answers SET body = $1
     WHERE id = $2 AND (answered_by = $3 OR $4 = 'admin')
     RETURNING *`,
    [body, answerId, userId, userRole]
  );

  if (result.rows.length === 0) {
    throw new AppError('Answer not found or permission denied', 404);
  }

  return result.rows[0];
}

export async function deleteInquiry(id: number, userId: number, userRole: string) {
  const result = await pool.query(
    `DELETE FROM inquiries
     WHERE id = $1 AND (asked_by = $2 OR $3 = 'admin')
     RETURNING id`,
    [id, userId, userRole]
  );

  if (result.rows.length === 0) {
    throw new AppError('Inquiry not found or permission denied', 404);
  }
}
