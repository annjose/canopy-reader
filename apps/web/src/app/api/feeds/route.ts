import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Feed } from "@canopy/shared";
import { requireAccess } from "@/lib/access";
import { generateId, nowISO } from "@/lib/utils";
import { resolveAndFetchFeed } from "@/lib/feed-discovery";
import { insertFeed, getFeedByUrl, listFeeds } from "@/lib/feeds-db";

export async function GET(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { env } = await getCloudflareContext({ async: true });
    const folder = request.nextUrl.searchParams.get("folder") || undefined;

    const feeds = await listFeeds(env.DB, { folder });

    return NextResponse.json({ feeds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { url, folder } = (await request.json()) as {
      url: string;
      folder?: string;
    };

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });

    // Resolve feed URL (auto-discover if needed) and parse
    const { feedUrl, feed: parsed } = await resolveAndFetchFeed(url);

    // Check for duplicate
    const existing = await getFeedByUrl(env.DB, feedUrl);
    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed to this feed", feed: existing },
        { status: 409 },
      );
    }

    const now = nowISO();
    const feed: Feed = {
      id: generateId(),
      title: parsed.title,
      url: feedUrl,
      site_url: parsed.siteUrl,
      description: parsed.description,
      icon_url: parsed.iconUrl,
      folder: folder || null,
      last_fetched_at: null,
      last_successful_fetch_at: null,
      fetch_error: null,
      is_active: 1,
      created_at: now,
    };

    await insertFeed(env.DB, feed);

    return NextResponse.json({ feed }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
