CREATE TABLE IF NOT EXISTS files (
  id            SERIAL PRIMARY KEY,
  folder_id     INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  original_name VARCHAR(500) NOT NULL,
  stored_name   VARCHAR(500) NOT NULL UNIQUE,
  mime_type     VARCHAR(150) NOT NULL,
  file_size     BIGINT NOT NULL,
  uploaded_by   INTEGER NOT NULL REFERENCES users(id),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
