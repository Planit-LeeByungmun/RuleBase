CREATE TABLE IF NOT EXISTS folder_permissions (
  id         SERIAL PRIMARY KEY,
  folder_id  INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  can_read   BOOLEAN NOT NULL DEFAULT TRUE,
  can_write  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Partial unique index to handle NULL user_id (global/default permissions)
CREATE UNIQUE INDEX IF NOT EXISTS folder_permissions_folder_user_unique
  ON folder_permissions (folder_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS folder_permissions_folder_null_user_unique
  ON folder_permissions (folder_id)
  WHERE user_id IS NULL;
