import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getDocument } from "@/lib/db";
import { getFromR2 } from "@/lib/r2";

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
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!doc.content_r2_key) {
      return NextResponse.json({ error: "No content available" }, { status: 404 });
    }

    const content = await getFromR2(env.R2, doc.content_r2_key);
    if (!content) {
      return NextResponse.json({ error: "Content not found in storage" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
