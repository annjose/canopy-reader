import type { Document, DocumentStatus, DocumentType } from "@canopy/shared";
import { nowISO } from "./utils";

export async function insertDocument(
  db: D1Database,
  doc: Document,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO documents (
        id, type, status, is_favorite, is_trashed, trashed_at,
        title, author, description, url, domain, image_url, language,
        word_count, reading_time_minutes, published_at,
        reading_progress, last_read_position,
        content_r2_key, original_r2_key,
        feed_id, source, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?
      )`,
    )
    .bind(
      doc.id,
      doc.type,
      doc.status,
      doc.is_favorite,
      doc.is_trashed,
      doc.trashed_at,
      doc.title,
      doc.author,
      doc.description,
      doc.url,
      doc.domain,
      doc.image_url,
      doc.language,
      doc.word_count,
      doc.reading_time_minutes,
      doc.published_at,
      doc.reading_progress,
      doc.last_read_position,
      doc.content_r2_key,
      doc.original_r2_key,
      doc.feed_id,
      doc.source,
      doc.created_at,
      doc.updated_at,
    )
    .run();
}

export async function getDocument(
  db: D1Database,
  id: string,
): Promise<Document | null> {
  const result = await db
    .prepare("SELECT * FROM documents WHERE id = ? AND is_trashed = 0")
    .bind(id)
    .first<Document>();
  return result ?? null;
}

export interface ListDocumentsFilters {
  status?: DocumentStatus;
  type?: DocumentType;
  q?: string;
  /** Filter by tag slug (kebab-case) */
  tag?: string;
  sort?: "created_at" | "published_at" | "title";
  cursor?: string;
  limit?: number;
  is_trashed?: boolean;
  is_favorite?: boolean;
}

export async function listDocuments(
  db: D1Database,
  filters: ListDocumentsFilters = {},
): Promise<{ documents: Document[]; nextCursor: string | null }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Default: not trashed
  if (filters.is_trashed) {
    conditions.push("is_trashed = 1");
  } else {
    conditions.push("is_trashed = 0");
  }

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }

  if (filters.is_favorite) {
    conditions.push("is_favorite = 1");
  }

  if (filters.q) {
    conditions.push(
      "(title LIKE ? OR author LIKE ? OR description LIKE ? OR domain LIKE ?)",
    );
    const pattern = `%${filters.q}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (filters.tag) {
    // Filter by tag slug.
    conditions.push(
      `id IN (
        SELECT dt.document_id
        FROM document_tags dt
        INNER JOIN tags t ON t.id = dt.tag_id
        WHERE t.slug = ?
      )`,
    );
    params.push(filters.tag);
  }

  const sort = filters.sort ?? "created_at";
  const sortDir = sort === "title" ? "ASC" : "DESC";

  if (filters.cursor) {
    if (sort === "title") {
      conditions.push(`${sort} > ?`);
    } else {
      conditions.push(`${sort} < ?`);
    }
    params.push(filters.cursor);
  }

  const limit = filters.limit ?? 50;
  params.push(limit + 1); // fetch one extra for cursor

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT * FROM documents ${where} ORDER BY ${sort} ${sortDir} LIMIT ?`;

  const result = await db
    .prepare(sql)
    .bind(...params)
    .all<Document>();

  const documents = result.results ?? [];
  let nextCursor: string | null = null;

  if (documents.length > limit) {
    documents.pop();
    const lastDoc = documents[documents.length - 1];
    nextCursor = String(lastDoc[sort as keyof Document]);
  }

  return { documents, nextCursor };
}

export async function updateDocument(
  db: D1Database,
  id: string,
  fields: Partial<
    Pick<
      Document,
      | "status"
      | "is_favorite"
      | "title"
      | "author"
      | "description"
      | "reading_progress"
      | "last_read_position"
    >
  >,
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (sets.length === 0) return;

  sets.push("updated_at = ?");
  params.push(nowISO());
  params.push(id);

  await db
    .prepare(`UPDATE documents SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function trashDocument(
  db: D1Database,
  id: string,
): Promise<void> {
  const now = nowISO();
  await db
    .prepare(
      "UPDATE documents SET is_trashed = 1, trashed_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(now, now, id)
    .run();
}

export async function restoreDocument(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare(
      "UPDATE documents SET is_trashed = 0, trashed_at = NULL, updated_at = ? WHERE id = ?",
    )
    .bind(nowISO(), id)
    .run();
}
