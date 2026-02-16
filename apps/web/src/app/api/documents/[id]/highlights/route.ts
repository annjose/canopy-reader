import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getDocument } from "@/lib/db";
import { createHighlight, listHighlights } from "@/lib/highlights";
import type { HighlightColor } from "@canopy/shared";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isHighlightColor(x: unknown): x is HighlightColor {
  return x === "yellow" || x === "blue" || x === "green" || x === "red" || x === "purple";
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

    const highlights = await listHighlights(env.DB, id);
    return NextResponse.json({ highlights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | {
          text?: unknown;
          note?: unknown;
          color?: unknown;
          position_data?: unknown;
        }
      | null;

    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return badRequest("text is required");
    if (text.length > 50_000) return badRequest("text too large");

    const note = typeof body?.note === "string" ? body.note : null;
    if (note && note.length > 100_000) return badRequest("note too large");

    const color = body?.color;
    if (color !== undefined && !isHighlightColor(color)) {
      return badRequest("invalid color");
    }

    const positionData =
      body?.position_data === undefined
        ? null
        : typeof body.position_data === "string"
          ? body.position_data
          : null;

    const { env } = await getCloudflareContext({ async: true });

    const doc = await getDocument(env.DB, id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const highlight = await createHighlight(env.DB, {
      document_id: id,
      text,
      note,
      color: (color as HighlightColor | undefined) ?? undefined,
      position_data: positionData,
    });

    return NextResponse.json(highlight, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
