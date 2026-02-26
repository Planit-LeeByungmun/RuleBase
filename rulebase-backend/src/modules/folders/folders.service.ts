import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export async function getFolderTree(userId: number, userRole: string) {
  if (userRole === 'admin') {
    // Admin sees all folders
    const result = await pool.query(
      `SELECT id, name, parent_id, sort_order FROM folders ORDER BY parent_id NULLS FIRST, sort_order, name`
    );
    return buildTree(result.rows);
  }

  // Get folders user has access to
  const result = await pool.query(
    `WITH RECURSIVE folder_tree AS (
      SELECT id, name, parent_id, sort_order
      FROM folders
      WHERE parent_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_id, f.sort_order
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_id = ft.id
    )
    SELECT DISTINCT ft.id, ft.name, ft.parent_id, ft.sort_order
    FROM folder_tree ft
    WHERE EXISTS (
      SELECT 1 FROM folder_permissions fp
      WHERE fp.folder_id = ft.id
        AND (fp.user_id = $1 OR fp.user_id IS NULL)
        AND fp.can_read = TRUE
    ) OR NOT EXISTS (
      SELECT 1 FROM folder_permissions fp2
      WHERE fp2.folder_id = ft.id
    )
    ORDER BY parent_id NULLS FIRST, sort_order, name`,
    [userId]
  );
  return buildTree(result.rows);
}

function buildTree(rows: any[]): any[] {
  const map = new Map<number, any>();
  const roots: any[] = [];

  rows.forEach(row => {
    map.set(row.id, { ...row, children: [] });
  });

  rows.forEach(row => {
    const node = map.get(row.id)!;
    if (row.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(row.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}

export async function createFolder(data: {
  name: string;
  parentId?: number;
  sortOrder?: number;
  createdBy: number;
}) {
  const result = await pool.query(
    `INSERT INTO folders (name, parent_id, sort_order, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, parent_id, sort_order`,
    [data.name, data.parentId || null, data.sortOrder || 0, data.createdBy]
  );
  return result.rows[0];
}

export async function updateFolder(id: number, data: { name?: string; parentId?: number; sortOrder?: number }) {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.parentId !== undefined) { sets.push(`parent_id = $${idx++}`); values.push(data.parentId); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

  if (sets.length === 0) throw new AppError('Nothing to update', 400);

  values.push(id);
  const result = await pool.query(
    `UPDATE folders SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) throw new AppError('Folder not found', 404);
  return result.rows[0];
}

export async function deleteFolder(id: number) {
  const result = await pool.query('DELETE FROM folders WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Folder not found', 404);
}

export async function setFolderPermissions(folderId: number, permissions: Array<{
  userId: number | null;
  canRead: boolean;
  canWrite: boolean;
}>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM folder_permissions WHERE folder_id = $1', [folderId]);

    for (const perm of permissions) {
      await client.query(
        `INSERT INTO folder_permissions (folder_id, user_id, can_read, can_write)
         VALUES ($1, $2, $3, $4)`,
        [folderId, perm.userId, perm.canRead, perm.canWrite]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getFolderPermissions(folderId: number) {
  const result = await pool.query(
    `SELECT fp.id, fp.user_id, fp.can_read, fp.can_write,
            u.username, u.display_name
     FROM folder_permissions fp
     LEFT JOIN users u ON fp.user_id = u.id
     WHERE fp.folder_id = $1`,
    [folderId]
  );
  return result.rows;
}

export async function getEffectivePermission(folderId: number, userId: number): Promise<{ canRead: boolean; canWrite: boolean }> {
  // Recursive CTE to check permission inheritance
  const result = await pool.query(
    `WITH RECURSIVE folder_ancestors AS (
      SELECT id, parent_id, 0 as depth FROM folders WHERE id = $1
      UNION ALL
      SELECT f.id, f.parent_id, fa.depth + 1
      FROM folders f
      INNER JOIN folder_ancestors fa ON f.id = fa.parent_id
    )
    SELECT fp.can_read, fp.can_write, fp.user_id, fa.depth
    FROM folder_ancestors fa
    INNER JOIN folder_permissions fp ON fp.folder_id = fa.id
    WHERE (fp.user_id = $2 OR fp.user_id IS NULL)
    ORDER BY fa.depth ASC, fp.user_id DESC NULLS LAST
    LIMIT 1`,
    [folderId, userId]
  );

  if (result.rows.length === 0) {
    return { canRead: true, canWrite: false }; // Default
  }

  return {
    canRead: result.rows[0].can_read,
    canWrite: result.rows[0].can_write,
  };
}
