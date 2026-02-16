import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { slugify } from "@/lib/slug";
import { createTag, getTagBySlug, listTags } from "@/lib/tags";

export async function GET(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { env } = await getCloudflareContext({ async: true });
    const tags = await listTags(env.DB);
    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json().catch(() => null)) as
      | { name?: string; color?: string | null }
      | null;

    const name = body?.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json(
        { error: "name must contain at least one letter or number" },
        { status: 400 },
      );
    }

    const { env } = await getCloudflareContext({ async: true });

    const existing = await getTagBySlug(env.DB, slug);
    if (existing) {
      return NextResponse.json(
        { error: "Tag already exists", tag: existing },
        { status: 409 },
      );
    }

    const tag = await createTag(env.DB, {
      name,
      slug,
      color: body?.color ?? null,
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
