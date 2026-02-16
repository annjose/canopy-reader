import type { Highlight, HighlightColor } from "@canopy/shared";
import { generateId, nowISO } from "./utils";

export async function listHighlights(
  db: D1Database,
  documentId: string,
): Promise<Highlight[]> {
  const result = await db
    .prepare(
      "SELECT * FROM highlights WHERE document_id = ? ORDER BY created_at ASC",
    )
    .bind(documentId)
    .all<Highlight>();

  return result.results ?? [];
}

export async function getHighlight(
  db: D1Database,
  id: string,
): Promise<Highlight | null> {
  const result = await db
    .prepare("SELECT * FROM highlights WHERE id = ?")
    .bind(id)
    .first<Highlight>();

  return result ?? null;
}

export async function createHighlight(
  db: D1Database,
  fields: {
    document_id: string;
    text: string;
    note?: string | null;
    color?: HighlightColor;
    position_data?: string | null;
  },
): Promise<Highlight> {
  const now = nowISO();
  const highlight: Highlight = {
    id: generateId(),
    document_id: fields.document_id,
    text: fields.text,
    note: fields.note ?? null,
    color: fields.color ?? "yellow",
    position_data: fields.position_data ?? null,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(
      `INSERT INTO highlights (
        id, document_id, text, note, color, position_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      highlight.id,
      highlight.document_id,
      highlight.text,
      highlight.note,
      highlight.color,
      highlight.position_data,
      highlight.created_at,
      highlight.updated_at,
    )
    .run();

  return highlight;
}

export async function updateHighlight(
  db: D1Database,
  id: string,
  fields: Partial<Pick<Highlight, "note" | "color" | "position_data">>,
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
    .prepare(`UPDATE highlights SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function deleteHighlight(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM highlights WHERE id = ?").bind(id).run();
}
