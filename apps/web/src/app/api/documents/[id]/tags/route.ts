import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getDocument } from "@/lib/db";
import { getTagsForDocument, replaceDocumentTags } from "@/lib/tags";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const doc = await getDocument(env.DB, id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tags = await getTagsForDocument(env.DB, id);
    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | { tagIds?: unknown }
      | null;

    if (!body || !Array.isArray(body.tagIds)) {
      return badRequest("tagIds must be an array");
    }

    const tagIds = body.tagIds
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);

    if (tagIds.length !== body.tagIds.length) {
      return badRequest("tagIds must be an array of strings");
    }

    // Basic safety limit.
    if (tagIds.length > 50) {
      return badRequest("Too many tags");
    }

    const { env } = await getCloudflareContext({ async: true });

    const doc = await getDocument(env.DB, id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Validate tag IDs exist (prevents silently creating broken joins).
    if (tagIds.length > 0) {
      const placeholders = tagIds.map(() => "?").join(",");
      const existing = await env.DB
        .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
        .bind(...tagIds)
        .all<{ id: string }>();

      const existingIds = new Set((existing.results ?? []).map((r) => r.id));
      const missing = tagIds.filter((t) => !existingIds.has(t));
      if (missing.length > 0) {
        return badRequest(`Unknown tag ids: ${missing.join(", ")}`);
      }
    }

    // De-dupe while preserving order.
    const uniqueTagIds: string[] = [];
    const seen = new Set<string>();
    for (const t of tagIds) {
      if (seen.has(t)) continue;
      seen.add(t);
      uniqueTagIds.push(t);
    }

    await replaceDocumentTags(env.DB, id, uniqueTagIds);

    const tags = await getTagsForDocument(env.DB, id);
    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
