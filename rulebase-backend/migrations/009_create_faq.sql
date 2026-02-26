CREATE TABLE IF NOT EXISTS faq_categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS faq_items (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  INTEGER NOT NULL REFERENCES users(id)
);
