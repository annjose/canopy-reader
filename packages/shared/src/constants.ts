import type { DocumentStatus, DocumentType, HighlightColor } from "./types";

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "inbox",
  "reading",
  "later",
  "archive",
];

export const DOCUMENT_TYPES: DocumentType[] = [
  "article",
  "book",
  "pdf",
  "email",
  "rss_item",
];

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  "yellow",
  "blue",
  "green",
  "red",
  "purple",
];

/** Display labels for document statuses */
export const STATUS_LABELS: Record<DocumentStatus, string> = {
  inbox: "Inbox",
  reading: "Reading",
  later: "Later",
  archive: "Archive",
};

/** Display labels for document types */
export const TYPE_LABELS: Record<DocumentType, string> = {
  article: "Article",
  book: "Book",
  pdf: "PDF",
  email: "Email",
  rss_item: "RSS",
};

/** Average reading speed in words per minute */
export const READING_WPM = 238;
