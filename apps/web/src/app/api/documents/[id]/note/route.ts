import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getDocument } from "@/lib/db";
import { getDocumentNote, upsertDocumentNote } from "@/lib/document-notes";

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

    const note = await getDocumentNote(env.DB, id);
    return NextResponse.json({ note });
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
      | { content?: unknown }
      | null;

    if (!body || typeof body.content !== "string") {
      return badRequest("content must be a string");
    }

    const content = body.content;
    if (content.length > 100_000) {
      return badRequest("content too large");
    }

    const { env } = await getCloudflareContext({ async: true });

    const doc = await getDocument(env.DB, id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const note = await upsertDocumentNote(env.DB, id, content);
    return NextResponse.json({ note });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
