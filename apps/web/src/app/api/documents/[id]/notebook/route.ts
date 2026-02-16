import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getDocument } from "@/lib/db";
import { getDocumentNote } from "@/lib/document-notes";
import { listHighlights } from "@/lib/highlights";
import { getTagsForDocument } from "@/lib/tags";

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

    const [tags, note, highlights] = await Promise.all([
      getTagsForDocument(env.DB, id),
      getDocumentNote(env.DB, id),
      listHighlights(env.DB, id),
    ]);

    return NextResponse.json({ tags, note, highlights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
