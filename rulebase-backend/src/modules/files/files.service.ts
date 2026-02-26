import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { getEffectivePermission } from '../folders/folders.service';
import fs from 'fs';
import path from 'path';

export async function getFilesInFolder(folderId: number, userId: number, userRole: string) {
  if (userRole !== 'admin') {
    const perm = await getEffectivePermission(folderId, userId);
    if (!perm.canRead) {
      throw new AppError('Access denied to this folder', 403);
    }
  }

  const result = await pool.query(
    `SELECT f.id, f.original_name, f.mime_type, f.file_size, f.sort_order, f.created_at,
            u.display_name as uploaded_by_name
     FROM files f
     INNER JOIN users u ON f.uploaded_by = u.id
     WHERE f.folder_id = $1
     ORDER BY f.sort_order, f.original_name`,
    [folderId]
  );
  return result.rows;
}

export async function getAllFiles(userId: number, userRole: string) {
  if (userRole === 'admin') {
    const result = await pool.query(
      `SELECT f.id, f.folder_id, f.original_name, f.mime_type, f.file_size, f.created_at,
              fold.name as folder_name, u.display_name as uploaded_by_name
       FROM files f
       INNER JOIN folders fold ON f.folder_id = fold.id
       INNER JOIN users u ON f.uploaded_by = u.id
       ORDER BY fold.name, f.original_name`
    );
    return result.rows;
  }

  const result = await pool.query(
    `SELECT f.id, f.folder_id, f.original_name, f.mime_type, f.file_size, f.created_at,
            fold.name as folder_name, u.display_name as uploaded_by_name
     FROM files f
     INNER JOIN folders fold ON f.folder_id = fold.id
     INNER JOIN users u ON f.uploaded_by = u.id
     WHERE (
       EXISTS (
         SELECT 1 FROM folder_permissions fp
         WHERE fp.folder_id = f.folder_id
           AND (fp.user_id = $1 OR fp.user_id IS NULL)
           AND fp.can_read = TRUE
       ) OR NOT EXISTS (
         SELECT 1 FROM folder_permissions fp2
         WHERE fp2.folder_id = f.folder_id
       )
     )
     ORDER BY fold.name, f.original_name`,
    [userId]
  );
  return result.rows;
}

export async function uploadFile(data: {
  folderId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
}) {
  const result = await pool.query(
    `INSERT INTO files (folder_id, original_name, stored_name, mime_type, file_size, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, folder_id, original_name, mime_type, file_size, created_at`,
    [data.folderId, data.originalName, data.storedName, data.mimeType, data.fileSize, data.uploadedBy]
  );
  return result.rows[0];
}

export async function getFileById(fileId: number) {
  const result = await pool.query(
    'SELECT * FROM files WHERE id = $1',
    [fileId]
  );
  if (result.rows.length === 0) {
    throw new AppError('File not found', 404);
  }
  return result.rows[0];
}

export async function deleteFile(fileId: number) {
  const result = await pool.query(
    'DELETE FROM files WHERE id = $1 RETURNING stored_name',
    [fileId]
  );
  if (result.rows.length === 0) {
    throw new AppError('File not found', 404);
  }

  const storedName = result.rows[0].stored_name;
  const filePath = path.join(__dirname, '../../../storage/uploads', storedName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
