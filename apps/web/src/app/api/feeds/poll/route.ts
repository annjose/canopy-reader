import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { pollAllFeeds, pollFeedById } from "@/lib/feed-poller";

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { env } = await getCloudflareContext({ async: true });

    // Optional: poll a single feed by passing { feedId } in body
    let body: { feedId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body — poll all feeds
    }

    if (body.feedId) {
      const result = await pollFeedById(env, body.feedId);
      return NextResponse.json({ results: [result] });
    }

    const results = await pollAllFeeds(env);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
