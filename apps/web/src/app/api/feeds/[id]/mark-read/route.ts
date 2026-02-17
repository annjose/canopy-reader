import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getFeed, markFeedItemsRead } from "@/lib/feeds-db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const feed = await getFeed(env.DB, id);
    if (!feed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await markFeedItemsRead(env.DB, id);

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
