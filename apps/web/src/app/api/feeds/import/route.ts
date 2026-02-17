import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { XMLParser } from "fast-xml-parser";
import type { Feed } from "@canopy/shared";
import { requireAccess } from "@/lib/access";
import { generateId, nowISO } from "@/lib/utils";
import { insertFeed, getFeedByUrl } from "@/lib/feeds-db";

interface OpmlOutline {
  "@_text"?: string;
  "@_title"?: string;
  "@_xmlUrl"?: string;
  "@_htmlUrl"?: string;
  "@_type"?: string;
  outline?: OpmlOutline | OpmlOutline[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "outline",
});

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let xml: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "file is required" }, { status: 400 });
      }
      xml = await file.text();
    } else {
      xml = await request.text();
    }

    if (!xml.trim()) {
      return NextResponse.json({ error: "Empty OPML content" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const doc = parser.parse(xml);

    const body = doc.opml?.body ?? doc.body;
    if (!body) {
      return NextResponse.json({ error: "Invalid OPML: no body found" }, { status: 400 });
    }

    const outlines = asArray(body.outline);
    const created: string[] = [];
    const skipped: string[] = [];

    for (const outline of outlines) {
      await processOutline(env.DB, outline, null, created, skipped);
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      feeds: created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processOutline(
  db: D1Database,
  outline: OpmlOutline,
  folder: string | null,
  created: string[],
  skipped: string[],
): Promise<void> {
  const feedUrl = outline["@_xmlUrl"];

  if (feedUrl) {
    // This is a feed outline
    const existing = await getFeedByUrl(db, feedUrl);
    if (existing) {
      skipped.push(feedUrl);
      return;
    }

    const now = nowISO();
    const feed: Feed = {
      id: generateId(),
      title: outline["@_title"] || outline["@_text"] || feedUrl,
      url: feedUrl,
      site_url: outline["@_htmlUrl"] || null,
      description: null,
      icon_url: null,
      folder,
      last_fetched_at: null,
      last_successful_fetch_at: null,
      fetch_error: null,
      is_active: 1,
      created_at: now,
    };

    await insertFeed(db, feed);
    created.push(feed.title);
    return;
  }

  // This is a folder outline — recurse into children
  const folderName = outline["@_title"] || outline["@_text"] || null;
  const children = asArray(outline.outline);
  for (const child of children) {
    await processOutline(db, child, folderName ?? folder, created, skipped);
  }
}

function asArray(val: unknown): OpmlOutline[] {
  if (Array.isArray(val)) return val;
  if (val != null && typeof val === "object") return [val as OpmlOutline];
  return [];
}
