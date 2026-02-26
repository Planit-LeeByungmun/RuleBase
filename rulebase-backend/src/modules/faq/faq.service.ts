import { pool } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export async function getCategoriesWithItems() {
  const result = await pool.query(
    `SELECT fc.id, fc.name, fc.sort_order,
            COALESCE(json_agg(
              json_build_object(
                'id', fi.id,
                'question', fi.question,
                'answer', fi.answer,
                'sort_order', fi.sort_order
              ) ORDER BY fi.sort_order
            ) FILTER (WHERE fi.id IS NOT NULL), '[]') as items
     FROM faq_categories fc
     LEFT JOIN faq_items fi ON fi.category_id = fc.id
     GROUP BY fc.id
     ORDER BY fc.sort_order, fc.name`
  );
  return result.rows;
}

export async function createCategory(data: { name: string; sortOrder?: number; createdBy: number }) {
  const result = await pool.query(
    `INSERT INTO faq_categories (name, sort_order, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.sortOrder || 0, data.createdBy]
  );
  return result.rows[0];
}

export async function updateCategory(id: number, data: { name?: string; sortOrder?: number }) {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

  if (sets.length === 0) throw new AppError('Nothing to update', 400);

  values.push(id);
  const result = await pool.query(
    `UPDATE faq_categories SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) throw new AppError('Category not found', 404);
  return result.rows[0];
}

export async function deleteCategory(id: number) {
  const result = await pool.query('DELETE FROM faq_categories WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Category not found', 404);
}

export async function createItem(data: {
  categoryId: number;
  question: string;
  answer: string;
  sortOrder?: number;
  createdBy: number;
}) {
  const result = await pool.query(
    `INSERT INTO faq_items (category_id, question, answer, sort_order, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.categoryId, data.question, data.answer, data.sortOrder || 0, data.createdBy]
  );
  return result.rows[0];
}

export async function updateItem(id: number, data: { question?: string; answer?: string; sortOrder?: number }) {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.question !== undefined) { sets.push(`question = $${idx++}`); values.push(data.question); }
  if (data.answer !== undefined) { sets.push(`answer = $${idx++}`); values.push(data.answer); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

  if (sets.length === 0) throw new AppError('Nothing to update', 400);

  values.push(id);
  const result = await pool.query(
    `UPDATE faq_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) throw new AppError('Item not found', 404);
  return result.rows[0];
}

export async function deleteItem(id: number) {
  const result = await pool.query('DELETE FROM faq_items WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new AppError('Item not found', 404);
}
