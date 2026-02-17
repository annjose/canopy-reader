import type { Document, Feed } from "@canopy/shared";
import { fetchFeed, type ParsedFeedItem } from "./feed-parser";
import { parseArticle } from "./parser";
import { getActiveFeeds, getFeed, updateFeedFetchStatus } from "./feeds-db";
import { insertDocument } from "./db";
import { uploadToR2, contentKey } from "./r2";
import { generateId, extractDomain, calculateReadingTime, nowISO } from "./utils";

export interface PollResult {
  feedId: string;
  feedTitle: string;
  newItems: number;
  errors: string[];
}

/**
 * Poll a single feed: fetch XML, dedup items, parse content, create documents.
 */
export async function pollFeed(
  env: { DB: D1Database; R2: R2Bucket },
  feed: Feed,
): Promise<PollResult> {
  const result: PollResult = {
    feedId: feed.id,
    feedTitle: feed.title,
    newItems: 0,
    errors: [],
  };

  try {
    const parsed = await fetchFeed(feed.url);

    for (const item of parsed.items) {
      if (!item.url) continue;

      try {
        // Dedup: skip if this URL already exists for this feed
        const existing = await env.DB
          .prepare("SELECT id FROM documents WHERE url = ? AND feed_id = ?")
          .bind(item.url, feed.id)
          .first<{ id: string }>();

        if (existing) continue;

        await createDocumentFromItem(env, feed, item);
        result.newItems++;
      } catch (itemError) {
        const msg = itemError instanceof Error ? itemError.message : "Unknown error";
        result.errors.push(`${item.url}: ${msg}`);
      }
    }

    await updateFeedFetchStatus(env.DB, feed.id, { success: true });
  } catch (feedError) {
    const msg = feedError instanceof Error ? feedError.message : "Unknown error";
    result.errors.push(msg);
    await updateFeedFetchStatus(env.DB, feed.id, {
      success: false,
      error: msg,
    });
  }

  return result;
}

/**
 * Poll all active feeds.
 */
export async function pollAllFeeds(
  env: { DB: D1Database; R2: R2Bucket },
): Promise<PollResult[]> {
  const feeds = await getActiveFeeds(env.DB);
  const results: PollResult[] = [];

  for (const feed of feeds) {
    const result = await pollFeed(env, feed);
    results.push(result);
  }

  return results;
}

/**
 * Poll a single feed by ID.
 */
export async function pollFeedById(
  env: { DB: D1Database; R2: R2Bucket },
  feedId: string,
): Promise<PollResult> {
  const feed = await getFeed(env.DB, feedId);
  if (!feed) {
    return {
      feedId,
      feedTitle: "Unknown",
      newItems: 0,
      errors: ["Feed not found"],
    };
  }
  return pollFeed(env, feed);
}

// --- Internal ---

async function createDocumentFromItem(
  env: { DB: D1Database; R2: R2Bucket },
  feed: Feed,
  item: ParsedFeedItem,
): Promise<void> {
  const id = generateId();
  const now = nowISO();

  // Try Readability for full content, fall back to RSS content
  let content: string;
  let wordCount: number;
  let imageUrl: string | null = item.imageUrl;
  let author = item.author;

  try {
    const parsed = await parseArticle(item.url);
    content = parsed.content;
    wordCount = parsed.wordCount;
    imageUrl = imageUrl ?? parsed.imageUrl;
    author = author ?? parsed.author;
  } catch {
    // Fall back to RSS content
    content = item.contentHtml ?? item.description ?? "";
    const textContent = content.replace(/<[^>]*>/g, "");
    wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
  }

  // Upload content to R2
  const r2Key = contentKey(id);
  await uploadToR2(env.R2, r2Key, content);

  const doc: Document = {
    id,
    type: "rss_item",
    status: "inbox",
    is_favorite: 0,
    is_trashed: 0,
    trashed_at: null,
    title: item.title,
    author,
    description: item.description,
    url: item.url,
    domain: extractDomain(item.url),
    image_url: imageUrl,
    language: null,
    word_count: wordCount,
    reading_time_minutes: calculateReadingTime(wordCount),
    published_at: item.publishedAt ? normalizeDate(item.publishedAt) : null,
    reading_progress: 0,
    last_read_position: null,
    content_r2_key: r2Key,
    original_r2_key: null,
    feed_id: feed.id,
    source: "feed",
    created_at: now,
    updated_at: now,
  };

  await insertDocument(env.DB, doc);
}

function normalizeDate(dateStr: string): string | null {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}
