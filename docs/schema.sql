-- Canopy — Database Schema (Cloudflare D1 / SQLite)
-- Full schema for all phases. Apply incrementally as phases are built.

----------------------------------------------------------------------
-- Phase 1: Documents (articles only initially)
----------------------------------------------------------------------

CREATE TABLE documents (
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
  feed_id TEXT REFERENCES feeds(id) ON DELETE SET NULL, -- only for rss_item type
  source TEXT,                                      -- 'extension' | 'manual' | 'email' | 'feed' | 'upload'

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_is_trashed ON documents(is_trashed);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_feed_id ON documents(feed_id);
CREATE INDEX idx_documents_is_favorite ON documents(is_favorite);

----------------------------------------------------------------------
-- Phase 2: Tags, Highlights, Notes
----------------------------------------------------------------------

CREATE TABLE tags (
  id TEXT PRIMARY KEY,                              -- nanoid
  name TEXT NOT NULL UNIQUE,                        -- kebab-case, e.g. 'machine-learning'
  color TEXT,                                       -- optional hex color
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE document_tags (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

CREATE INDEX idx_document_tags_tag_id ON document_tags(tag_id);

CREATE TABLE highlights (
  id TEXT PRIMARY KEY,                              -- nanoid
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,                               -- the highlighted text
  note TEXT,                                        -- optional note on this highlight
  color TEXT NOT NULL DEFAULT 'yellow',             -- yellow | blue | green | red | purple
  position_data TEXT,                               -- JSON: {start, end, chapter, percentage}
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_highlights_document_id ON highlights(document_id);

CREATE TABLE document_notes (
  id TEXT PRIMARY KEY,                              -- nanoid
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                            -- markdown text
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_document_notes_document_id ON document_notes(document_id);

----------------------------------------------------------------------
-- Phase 3: RSS Feeds
----------------------------------------------------------------------

CREATE TABLE feeds (
  id TEXT PRIMARY KEY,                              -- nanoid
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,                         -- feed URL (RSS/Atom)
  site_url TEXT,                                    -- website home URL
  description TEXT,
  icon_url TEXT,                                    -- favicon or feed icon
  folder TEXT,                                      -- optional folder for grouping
  last_fetched_at TEXT,                             -- ISO 8601, last poll attempt
  last_successful_fetch_at TEXT,                    -- ISO 8601, last successful poll
  fetch_error TEXT,                                 -- error message from last failed fetch
  is_active INTEGER NOT NULL DEFAULT 1,             -- whether polling is enabled
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feeds_is_active ON feeds(is_active);
