-- Migration 0001: Create documents table (Phase 1)
-- Stores all content types. Phase 1 uses type='article' only.

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,                              -- nanoid
  type TEXT NOT NULL,                               -- 'article' | 'book' | 'pdf' | 'email' | 'rss_item'
  status TEXT NOT NULL DEFAULT 'inbox',             -- 'inbox' | 'reading' | 'later' | 'archive'
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_trashed INTEGER NOT NULL DEFAULT 0,
  trashed_at TEXT,                                  -- ISO 8601, set when is_trashed = 1

  -- Metadata
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,                                 -- summary or excerpt
  url TEXT,                                         -- original URL (null for uploaded files)
  domain TEXT,                                      -- extracted from url for display
  image_url TEXT,                                   -- thumbnail or cover image
  language TEXT,
  word_count INTEGER,
  reading_time_minutes INTEGER,
  published_at TEXT,                                -- ISO 8601, original publish date

  -- Reading progress
  reading_progress REAL NOT NULL DEFAULT 0,         -- 0.0 to 1.0
  last_read_position TEXT,                          -- JSON: scroll offset or chapter marker

  -- R2 storage references
  content_r2_key TEXT,                              -- parsed readable HTML
  original_r2_key TEXT,                             -- original file (EPUB, PDF)

  -- Source tracking
  feed_id TEXT,                                     -- FK to feeds table (Phase 3)
  source TEXT,                                      -- 'extension' | 'manual' | 'email' | 'feed' | 'upload'

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_is_trashed ON documents(is_trashed);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_feed_id ON documents(feed_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_favorite ON documents(is_favorite);
