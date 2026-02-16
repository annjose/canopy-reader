import type { Tag, TagWithCount } from "@canopy/shared";
import { generateId, nowISO } from "./utils";

export async function listTags(db: D1Database): Promise<Tag[]> {
  const result = await db
    .prepare("SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC")
    .all<Tag>();
  return result.results ?? [];
}

export async function listTagsWithCounts(
  db: D1Database,
): Promise<TagWithCount[]> {
  const result = await db
    .prepare(
      `SELECT
         t.id,
         t.name,
         t.slug,
         t.color,
         t.created_at,
         COUNT(dt.document_id) AS document_count
       FROM tags t
       LEFT JOIN document_tags dt ON dt.tag_id = t.id
       GROUP BY t.id, t.name, t.slug, t.color, t.created_at
       ORDER BY t.name COLLATE NOCASE ASC`,
    )
    .all<
      Omit<TagWithCount, "document_count"> & { document_count: number | string }
    >();

  return (result.results ?? []).map((row) => ({
    ...row,
    document_count: Number(row.document_count) || 0,
  }));
}

export async function getTagById(
  db: D1Database,
  id: string,
): Promise<Tag | null> {
  const result = await db
    .prepare("SELECT * FROM tags WHERE id = ?")
    .bind(id)
    .first<Tag>();
  return result ?? null;
}

export async function getTagBySlug(
  db: D1Database,
  slug: string,
): Promise<Tag | null> {
  const result = await db
    .prepare("SELECT * FROM tags WHERE slug = ?")
    .bind(slug)
    .first<Tag>();
  return result ?? null;
}

export async function createTag(
  db: D1Database,
  fields: { name: string; slug: string; color?: string | null },
): Promise<Tag> {
  const tag: Tag = {
    id: generateId(),
    name: fields.name,
    slug: fields.slug,
    color: fields.color ?? null,
    created_at: nowISO(),
  };

  await db
    .prepare(
      "INSERT INTO tags (id, name, slug, color, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(tag.id, tag.name, tag.slug, tag.color, tag.created_at)
    .run();

  return tag;
}

export async function updateTag(
  db: D1Database,
  id: string,
  fields: Partial<Pick<Tag, "name" | "slug" | "color">>,
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

  params.push(id);
  await db
    .prepare(`UPDATE tags SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function deleteTag(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
}

export async function getTagsForDocument(
  db: D1Database,
  documentId: string,
): Promise<Tag[]> {
  const result = await db
    .prepare(
      `SELECT t.*
       FROM tags t
       INNER JOIN document_tags dt ON dt.tag_id = t.id
       WHERE dt.document_id = ?
       ORDER BY t.name COLLATE NOCASE ASC`,
    )
    .bind(documentId)
    .all<Tag>();

  return result.results ?? [];
}

export async function replaceDocumentTags(
  db: D1Database,
  documentId: string,
  tagIds: string[],
): Promise<void> {
  const statements: D1PreparedStatement[] = [];
  statements.push(
    db.prepare("DELETE FROM document_tags WHERE document_id = ?").bind(documentId),
  );

  for (const tagId of tagIds) {
    statements.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO document_tags (document_id, tag_id) VALUES (?, ?)",
        )
        .bind(documentId, tagId),
    );
  }

  await db.batch(statements);
}

export async function mergeTagInto(
  db: D1Database,
  sourceTagId: string,
  targetTagId: string,
): Promise<void> {
  // Move all existing document links to target tag.
  await db
    .prepare(
      `INSERT OR IGNORE INTO document_tags (document_id, tag_id)
       SELECT document_id, ?
       FROM document_tags
       WHERE tag_id = ?`,
    )
    .bind(targetTagId, sourceTagId)
    .run();

  // Clean up old links and delete the source tag.
  await db
    .prepare("DELETE FROM document_tags WHERE tag_id = ?")
    .bind(sourceTagId)
    .run();
  await deleteTag(db, sourceTagId);
}
