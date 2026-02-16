import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Document, DocumentStatus, DocumentType } from "@canopy/shared";
import { requireAccess } from "@/lib/access";
import { parseArticle } from "@/lib/parser";
import { generateId, nowISO } from "@/lib/utils";
import { contentKey, thumbnailKey, uploadToR2 } from "@/lib/r2";
import { insertDocument, listDocuments } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = (await request.json()) as { url: string };
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const parsed = await parseArticle(url);
    const id = generateId();
    const now = nowISO();

    // Upload parsed HTML to R2
    const r2Key = contentKey(id);
    await uploadToR2(env.R2, r2Key, parsed.content);

    // Best-effort thumbnail upload
    let imageUrl = parsed.imageUrl;
    if (parsed.imageUrl) {
      try {
        const imgResponse = await fetch(parsed.imageUrl);
        if (imgResponse.ok) {
          const imgData = await imgResponse.arrayBuffer();
          await uploadToR2(env.R2, thumbnailKey(id), imgData);
        }
      } catch {
        // Skip thumbnail on failure
      }
    }

    const doc: Document = {
      id,
      type: "article",
      status: "inbox",
      is_favorite: 0,
      is_trashed: 0,
      trashed_at: null,
      title: parsed.title,
      author: parsed.author,
      description: parsed.excerpt,
      url,
      domain: parsed.domain,
      image_url: imageUrl,
      language: parsed.language,
      word_count: parsed.wordCount,
      reading_time_minutes: parsed.readingTimeMinutes,
      published_at: parsed.publishedAt,
      reading_progress: 0,
      last_read_position: null,
      content_r2_key: r2Key,
      original_r2_key: null,
      feed_id: null,
      source: "manual",
      created_at: now,
      updated_at: now,
    };

    await insertDocument(env.DB, doc);

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { env } = await getCloudflareContext({ async: true });
    const params = request.nextUrl.searchParams;

    const result = await listDocuments(env.DB, {
      status: (params.get("status") as DocumentStatus) || undefined,
      type: (params.get("type") as DocumentType) || undefined,
      q: params.get("q") || undefined,
      sort:
        (params.get("sort") as "created_at" | "published_at" | "title") ||
        undefined,
      cursor: params.get("cursor") || undefined,
      limit: params.has("limit") ? Number(params.get("limit")) : undefined,
      is_trashed: params.get("is_trashed") === "true",
      is_favorite: params.get("is_favorite") === "true",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
