import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import { slugify } from "@/lib/slug";
import { deleteTag, getTagById, getTagBySlug, updateTag } from "@/lib/tags";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | { name?: string; color?: string | null }
      | null;

    if (!body || (body.name === undefined && body.color === undefined)) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const { env } = await getCloudflareContext({ async: true });

    const existing = await getTagById(env.DB, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextName = body.name !== undefined ? body.name.trim() : undefined;
    if (body.name !== undefined && !nextName) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }

    const nextSlug =
      body.name !== undefined && nextName ? slugify(nextName) : undefined;

    if (nextSlug && nextSlug !== existing.slug) {
      const collision = await getTagBySlug(env.DB, nextSlug);
      if (collision && collision.id !== id) {
        return NextResponse.json(
          { error: "Tag already exists", tag: collision },
          { status: 409 },
        );
      }
    }

    await updateTag(env.DB, id, {
      name: nextName,
      slug: nextSlug,
      color: body.color,
    });

    const updated = await getTagById(env.DB, id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAccess(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const existing = await getTagById(env.DB, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteTag(env.DB, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
