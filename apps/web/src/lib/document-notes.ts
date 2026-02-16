import type { DocumentNote } from "@canopy/shared";
import { generateId, nowISO } from "./utils";

export async function getDocumentNote(
  db: D1Database,
  documentId: string,
): Promise<DocumentNote | null> {
  const result = await db
    .prepare("SELECT * FROM document_notes WHERE document_id = ?")
    .bind(documentId)
    .first<DocumentNote>();

  return result ?? null;
}

export async function upsertDocumentNote(
  db: D1Database,
  documentId: string,
  content: string,
): Promise<DocumentNote> {
  const now = nowISO();

  // Enforced by unique index on document_id.
  await db
    .prepare(
      `INSERT INTO document_notes (id, document_id, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(document_id)
       DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
    )
    .bind(generateId(), documentId, content, now, now)
    .run();

  const note = await getDocumentNote(db, documentId);
  if (!note) throw new Error("Failed to upsert document note");
  return note;
}
