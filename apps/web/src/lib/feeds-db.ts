import type { Feed } from "@canopy/shared";
import { nowISO } from "./utils";

export async function insertFeed(
  db: D1Database,
  feed: Feed,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO feeds (
        id, title, url, site_url, description, icon_url, folder,
        last_fetched_at, last_successful_fetch_at, fetch_error,
        is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      feed.id,
      feed.title,
      feed.url,
      feed.site_url,
      feed.description,
      feed.icon_url,
      feed.folder,
      feed.last_fetched_at,
      feed.last_successful_fetch_at,
      feed.fetch_error,
      feed.is_active,
      feed.created_at,
    )
    .run();
}

export async function getFeed(
  db: D1Database,
  id: string,
): Promise<Feed | null> {
  const result = await db
    .prepare("SELECT * FROM feeds WHERE id = ?")
    .bind(id)
    .first<Feed>();
  return result ?? null;
}

export async function getFeedByUrl(
  db: D1Database,
  url: string,
): Promise<Feed | null> {
  const result = await db
    .prepare("SELECT * FROM feeds WHERE url = ?")
    .bind(url)
    .first<Feed>();
  return result ?? null;
}

export interface FeedWithCountRow extends Feed {
  item_count: number;
}

export async function listFeeds(
  db: D1Database,
  opts?: { folder?: string },
): Promise<FeedWithCountRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts?.folder) {
    conditions.push("f.folder = ?");
    params.push(opts.folder);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await db
    .prepare(
      `SELECT f.*, COUNT(d.id) AS item_count
       FROM feeds f
       LEFT JOIN documents d ON d.feed_id = f.id AND d.is_trashed = 0
       ${where}
       GROUP BY f.id
       ORDER BY f.title COLLATE NOCASE ASC`,
    )
    .bind(...params)
    .all<FeedWithCountRow>();

  return result.results ?? [];
}

export async function updateFeed(
  db: D1Database,
  id: string,
  fields: Partial<Pick<Feed, "title" | "folder" | "is_active">>,
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
    .prepare(`UPDATE feeds SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function deleteFeed(
  db: D1Database,
  id: string,
): Promise<void> {
  // Nullify feed_id on orphaned documents so they remain accessible
  await db
    .prepare("UPDATE documents SET feed_id = NULL WHERE feed_id = ?")
    .bind(id)
    .run();

  await db
    .prepare("DELETE FROM feeds WHERE id = ?")
    .bind(id)
    .run();
}

export async function updateFeedFetchStatus(
  db: D1Database,
  id: string,
  status: { success: boolean; error?: string },
): Promise<void> {
  const now = nowISO();

  if (status.success) {
    await db
      .prepare(
        `UPDATE feeds
         SET last_fetched_at = ?, last_successful_fetch_at = ?, fetch_error = NULL
         WHERE id = ?`,
      )
      .bind(now, now, id)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE feeds
         SET last_fetched_at = ?, fetch_error = ?
         WHERE id = ?`,
      )
      .bind(now, status.error ?? "Unknown error", id)
      .run();
  }
}

export async function getActiveFeeds(
  db: D1Database,
): Promise<Feed[]> {
  const result = await db
    .prepare("SELECT * FROM feeds WHERE is_active = 1")
    .all<Feed>();
  return result.results ?? [];
}

export async function listFeedFolders(
  db: D1Database,
): Promise<string[]> {
  const result = await db
    .prepare(
      "SELECT DISTINCT folder FROM feeds WHERE folder IS NOT NULL ORDER BY folder COLLATE NOCASE ASC",
    )
    .all<{ folder: string }>();
  return (result.results ?? []).map((r) => r.folder);
}

export async function markFeedItemsRead(
  db: D1Database,
  feedId: string,
): Promise<number> {
  const now = nowISO();
  const result = await db
    .prepare(
      `UPDATE documents
       SET status = 'archive', updated_at = ?
       WHERE feed_id = ? AND status = 'inbox' AND is_trashed = 0`,
    )
    .bind(now, feedId)
    .run();
  return result.meta?.changes ?? 0;
}
