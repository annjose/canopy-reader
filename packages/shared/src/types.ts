/** Content type for a document */
export type DocumentType = "article" | "book" | "pdf" | "email" | "rss_item";

/** Workflow status for a document */
export type DocumentStatus = "inbox" | "reading" | "later" | "archive";

/** How a document was saved */
export type DocumentSource =
  | "extension"
  | "manual"
  | "email"
  | "feed"
  | "upload";

/** Highlight color options */
export type HighlightColor = "yellow" | "blue" | "green" | "red" | "purple";

/** Core document entity */
export interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  is_favorite: number; // 0 or 1 (SQLite boolean)
  is_trashed: number;
  trashed_at: string | null;

  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  domain: string | null;
  image_url: string | null;
  language: string | null;
  word_count: number | null;
  reading_time_minutes: number | null;
  published_at: string | null;

  reading_progress: number;
  last_read_position: string | null;

  content_r2_key: string | null;
  original_r2_key: string | null;

  feed_id: string | null;
  source: DocumentSource | null;

  created_at: string;
  updated_at: string;

  /** Optional tags included in list-oriented payloads */
  tags?: Tag[];
  /** Optional feed title included in list-oriented payloads for rss_item documents */
  feed_title?: string;
}

/** Tag for organizing documents */
export interface Tag {
  id: string;
  /** Display name (spaces/case allowed) */
  name: string;
  /** Kebab-case slug used in URLs and for uniqueness */
  slug: string;
  color: string | null;
  created_at: string;
}

/** Tag with computed number of linked documents */
export interface TagWithCount extends Tag {
  document_count: number;
}

/** Join table for document-tag relationship */
export interface DocumentTag {
  document_id: string;
  tag_id: string;
}

/** Text highlight within a document */
export interface Highlight {
  id: string;
  document_id: string;
  text: string;
  note: string | null;
  color: HighlightColor;
  position_data: string | null;
  created_at: string;
  updated_at: string;
}

/** Freeform note attached to a document */
export interface DocumentNote {
  id: string;
  document_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/** Bundle of tags, note, and highlights for a document notebook panel */
export interface NotebookData {
  tags: Tag[];
  note: DocumentNote | null;
  highlights: Highlight[];
}

/** RSS/Atom feed subscription */
export interface Feed {
  id: string;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  icon_url: string | null;
  folder: string | null;
  last_fetched_at: string | null;
  last_successful_fetch_at: string | null;
  fetch_error: string | null;
  is_active: number;
  created_at: string;
}

/** Feed with computed item count for list views */
export interface FeedWithCount extends Feed {
  item_count: number;
}
