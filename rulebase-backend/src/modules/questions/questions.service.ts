import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { extractMentions } from '../../shared/utils/mentionParser';
import * as notificationService from '../notifications/notifications.service';

export async function getQuestions(fileId: number) {
  const result = await pool.query(
    `SELECT q.id, q.body, q.is_resolved, q.created_at,
            u.id as asker_id, u.username, u.display_name,
            COALESCE(json_agg(
              json_build_object(
                'id', a.id,
                'body', a.body,
                'created_at', a.created_at,
                'answerer_id', au.id,
                'answerer_username', au.username,
                'answerer_display_name', au.display_name
              ) ORDER BY a.created_at
            ) FILTER (WHERE a.id IS NOT NULL), '[]') as answers
     FROM questions q
     INNER JOIN users u ON q.asked_by = u.id
     LEFT JOIN answers a ON a.question_id = q.id
     LEFT JOIN users au ON a.answered_by = au.id
     WHERE q.file_id = $1
     GROUP BY q.id, u.id, u.username, u.display_name
     ORDER BY q.created_at DESC`,
    [fileId]
  );
  return result.rows;
}

export async function createQuestion(data: {
  fileId: number;
  askedBy: number;
  body: string;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const qResult = await client.query(
      `INSERT INTO questions (file_id, asked_by, body) VALUES ($1, $2, $3) RETURNING *`,
      [data.fileId, data.askedBy, data.body]
    );
    const question = qResult.rows[0];

    // Extract and process mentions
    const mentionedUsernames = extractMentions(data.body);

    if (mentionedUsernames.length > 0) {
      const fileResult = await client.query(
        `SELECT f.id, f.original_name, u.display_name as asker_name, u.email as asker_email
         FROM files f
         INNER JOIN users u ON u.id = $2
         WHERE f.id = $1`,
        [data.fileId, data.askedBy]
      );
      const file = fileResult.rows[0];

      for (const username of mentionedUsernames) {
        const userResult = await client.query(
          `SELECT id, email, display_name FROM users WHERE username = $1 AND status = 'approved'`,
          [username]
        );
        if (userResult.rows.length > 0) {
          const mentionedUser = userResult.rows[0];
          await client.query(
            `INSERT INTO question_mentions (question_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [question.id, mentionedUser.id]
          );

          // Send email asynchronously
          notificationService.sendMentionNotification(
            mentionedUser.email,
            mentionedUser.display_name,
            file.asker_name,
            data.body,
            file.original_name,
            data.fileId
          ).catch(err => console.error('Failed to send mention notification:', err));
        }
      }
    }

    await client.query('COMMIT');
    return question;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createAnswer(data: {
  questionId: number;
  answeredBy: number;
  body: string;
}) {
  const qResult = await pool.query(
    `SELECT q.id, q.file_id, q.asked_by, f.original_name,
            u.email as asker_email, u.display_name as asker_name,
            ru.display_name as replier_name
     FROM questions q
     INNER JOIN files f ON f.id = q.file_id
     INNER JOIN users u ON u.id = q.asked_by
     INNER JOIN users ru ON ru.id = $2
     WHERE q.id = $1`,
    [data.questionId, data.answeredBy]
  );

  if (qResult.rows.length === 0) {
    throw new AppError('Question not found', 404);
  }

  const question = qResult.rows[0];

  const aResult = await pool.query(
    `INSERT INTO answers (question_id, answered_by, body) VALUES ($1, $2, $3) RETURNING *`,
    [data.questionId, data.answeredBy, data.body]
  );

  // Notify questioner if they're not the same as answerer
  if (question.asked_by !== data.answeredBy) {
    notificationService.sendReplyNotification(
      question.asker_email,
      question.asker_name,
      question.replier_name,
      data.body,
      question.original_name,
      question.file_id
    ).catch(err => console.error('Failed to send reply notification:', err));
  }

  return aResult.rows[0];
}

export async function resolveQuestion(questionId: number, userId: number, userRole: string) {
  const result = await pool.query(
    `UPDATE questions SET is_resolved = TRUE
     WHERE id = $1 AND (asked_by = $2 OR $3 = 'admin')
     RETURNING *`,
    [questionId, userId, userRole]
  );

  if (result.rows.length === 0) {
    throw new AppError('Question not found or permission denied', 404);
  }

  return result.rows[0];
}
