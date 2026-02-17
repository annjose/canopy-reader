-- Migration 0003: RSS Feeds (Phase 3)

CREATE TABLE IF NOT EXISTS feeds (
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

CREATE INDEX IF NOT EXISTS idx_feeds_is_active ON feeds(is_active);
