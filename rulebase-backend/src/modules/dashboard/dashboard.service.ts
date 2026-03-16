import { pool } from '../../config/database';
import { getEffectivePermission } from '../folders/folders.service';

export async function getDashboardStats(userId: number, userRole: string) {
  if (userRole === 'admin') {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM files)::int AS total_files,
        (SELECT COUNT(*) FROM folders)::int AS total_folders,
        (SELECT COUNT(*) FROM questions WHERE is_resolved = false)::int AS unresolved_questions,
        (SELECT COUNT(*) FROM faq_items)::int AS total_faq_items
    `);
    return result.rows[0];
  }

  // For regular users, count only files in folders they can read
  const foldersResult = await pool.query('SELECT id FROM folders');
  const allFolderIds: number[] = foldersResult.rows.map(r => r.id);

  const readableFolderIds: number[] = [];
  for (const folderId of allFolderIds) {
    const perm = await getEffectivePermission(folderId, userId);
    if (perm.canRead) readableFolderIds.push(folderId);
  }

  if (readableFolderIds.length === 0) {
    return { total_files: 0, total_folders: 0, unresolved_questions: 0, total_faq_items: 0 };
  }

  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM files WHERE folder_id = ANY($1))::int AS total_files,
      (SELECT COUNT(*) FROM folders WHERE id = ANY($1))::int AS total_folders,
      (SELECT COUNT(*) FROM questions q JOIN files f ON q.file_id = f.id WHERE f.folder_id = ANY($1) AND q.is_resolved = false)::int AS unresolved_questions,
      (SELECT COUNT(*) FROM faq_items)::int AS total_faq_items
  `, [readableFolderIds]);

  return result.rows[0];
}

export async function getRecentFiles(userId: number, userRole: string, limit = 10) {
  if (userRole === 'admin') {
    const result = await pool.query(`
      SELECT f.id, f.original_name, f.created_at,
             fo.name AS folder_name,
             u.display_name AS uploader_name
      FROM files f
      JOIN folders fo ON f.folder_id = fo.id
      JOIN users u ON f.uploaded_by = u.id
      ORDER BY f.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  const foldersResult = await pool.query('SELECT id FROM folders');
  const readableFolderIds: number[] = [];
  for (const row of foldersResult.rows) {
    const perm = await getEffectivePermission(row.id, userId);
    if (perm.canRead) readableFolderIds.push(row.id);
  }

  if (readableFolderIds.length === 0) return [];

  const result = await pool.query(`
    SELECT f.id, f.original_name, f.created_at,
           fo.name AS folder_name,
           u.display_name AS uploader_name
    FROM files f
    JOIN folders fo ON f.folder_id = fo.id
    JOIN users u ON f.uploaded_by = u.id
    WHERE f.folder_id = ANY($1)
    ORDER BY f.created_at DESC
    LIMIT $2
  `, [readableFolderIds, limit]);

  return result.rows;
}

export async function getRecentQuestions(userId: number, userRole: string, limit = 10) {
  if (userRole === 'admin') {
    const result = await pool.query(`
      SELECT q.id, q.body, q.is_resolved, q.created_at,
             f.original_name AS file_name,
             u.display_name AS author_name
      FROM questions q
      JOIN files f ON q.file_id = f.id
      JOIN users u ON q.asked_by = u.id
      ORDER BY q.created_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  const foldersResult = await pool.query('SELECT id FROM folders');
  const readableFolderIds: number[] = [];
  for (const row of foldersResult.rows) {
    const perm = await getEffectivePermission(row.id, userId);
    if (perm.canRead) readableFolderIds.push(row.id);
  }

  if (readableFolderIds.length === 0) return [];

  const result = await pool.query(`
    SELECT q.id, q.body, q.is_resolved, q.created_at,
           f.original_name AS file_name,
           u.display_name AS author_name
    FROM questions q
    JOIN files f ON q.file_id = f.id
    JOIN users u ON q.asked_by = u.id
    WHERE f.folder_id = ANY($1)
    ORDER BY q.created_at DESC
    LIMIT $2
  `, [readableFolderIds, limit]);

  return result.rows;
}

export async function getRecentInquiries(limit = 5) {
  const result = await pool.query(`
    SELECT i.id, i.title, i.is_resolved, i.created_at,
           u.display_name AS author_name,
           COUNT(ia.id)::int AS answer_count
    FROM inquiries i
    JOIN users u ON i.asked_by = u.id
    LEFT JOIN inquiry_answers ia ON ia.inquiry_id = i.id
    GROUP BY i.id, u.display_name
    ORDER BY i.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentFaqCategories() {
  const result = await pool.query(`
    SELECT fc.id, fc.name,
           COUNT(fi.id)::int AS item_count
    FROM faq_categories fc
    LEFT JOIN faq_items fi ON fi.category_id = fc.id
    GROUP BY fc.id
    ORDER BY fc.sort_order, fc.name
  `);
  return result.rows;
}
