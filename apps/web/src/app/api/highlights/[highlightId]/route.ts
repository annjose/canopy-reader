import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { deleteHighlight, getHighlight, updateHighlight } from "@/lib/highlights";
import type { HighlightColor } from "@canopy/shared";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isHighlightColor(x: unknown): x is HighlightColor {
  return x === "yellow" || x === "blue" || x === "green" || x === "red" || x === "purple";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ highlightId: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { highlightId } = await params;
    const body = (await request.json().catch(() => null)) as
      | { note?: unknown; color?: unknown; position_data?: unknown }
      | null;

    if (!body) return badRequest("Invalid JSON body");

    const fields: { note?: string | null; color?: HighlightColor; position_data?: string | null } = {};

    if (body.note !== undefined) {
      if (body.note === null) fields.note = null;
      else if (typeof body.note === "string") {
        if (body.note.length > 100_000) return badRequest("note too large");
        fields.note = body.note;
      } else {
        return badRequest("note must be a string or null");
      }
    }

    if (body.color !== undefined) {
      if (!isHighlightColor(body.color)) return badRequest("invalid color");
      fields.color = body.color;
    }

    if (body.position_data !== undefined) {
      if (body.position_data === null) fields.position_data = null;
      else if (typeof body.position_data === "string") fields.position_data = body.position_data;
      else return badRequest("position_data must be a string or null");
    }

    if (Object.keys(fields).length === 0) {
      return badRequest("No fields to update");
    }

    const { env } = await getCloudflareContext({ async: true });

    const existing = await getHighlight(env.DB, highlightId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await updateHighlight(env.DB, highlightId, fields);

    const updated = await getHighlight(env.DB, highlightId);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ highlightId: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { highlightId } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const existing = await getHighlight(env.DB, highlightId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await deleteHighlight(env.DB, highlightId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
