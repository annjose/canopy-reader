import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { getTagById, mergeTagInto } from "@/lib/tags";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json().catch(() => null)) as
      | { sourceTagId?: string; targetTagId?: string }
      | null;

    const sourceTagId = body?.sourceTagId?.trim();
    const targetTagId = body?.targetTagId?.trim();

    if (!sourceTagId || !targetTagId) {
      return badRequest("sourceTagId and targetTagId are required");
    }

    if (sourceTagId === targetTagId) {
      return badRequest("sourceTagId and targetTagId must be different");
    }

    const { env } = await getCloudflareContext({ async: true });

    const [sourceTag, targetTag] = await Promise.all([
      getTagById(env.DB, sourceTagId),
      getTagById(env.DB, targetTagId),
    ]);

    if (!sourceTag) {
      return NextResponse.json({ error: "Source tag not found" }, { status: 404 });
    }

    if (!targetTag) {
      return NextResponse.json({ error: "Target tag not found" }, { status: 404 });
    }

    await mergeTagInto(env.DB, sourceTagId, targetTagId);

    return NextResponse.json({ success: true, targetTagId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
