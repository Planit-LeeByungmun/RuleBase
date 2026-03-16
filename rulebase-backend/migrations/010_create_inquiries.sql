CREATE TABLE IF NOT EXISTS inquiries (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  body        TEXT NOT NULL,
  asked_by    INTEGER NOT NULL REFERENCES users(id),
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiry_answers (
  id          SERIAL PRIMARY KEY,
  inquiry_id  INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  answered_by INTEGER NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
