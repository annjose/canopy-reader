-- Migration 0002: Tags, Notes, Highlights (Phase 2)

-- Tags
-- - name: user-entered display name (can include spaces/case)
-- - slug: normalized kebab-case, used in URLs and for uniqueness
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,                              -- nanoid
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,                                       -- optional hex color
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Document <-> Tag join table
CREATE TABLE IF NOT EXISTS document_tags (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,                              -- nanoid
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,                               -- the highlighted text
  note TEXT,                                        -- optional note on this highlight
  color TEXT NOT NULL DEFAULT 'yellow',             -- yellow | blue | green | red | purple
  position_data TEXT,                               -- JSON: {start, end, quote, ...}
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_highlights_document_id ON highlights(document_id);
CREATE INDEX IF NOT EXISTS idx_highlights_document_id_created_at ON highlights(document_id, created_at);

-- Document-level note (one per document)
CREATE TABLE IF NOT EXISTS document_notes (
  id TEXT PRIMARY KEY,                              -- nanoid
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                            -- markdown text
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_notes_document_id_unique ON document_notes(document_id);
