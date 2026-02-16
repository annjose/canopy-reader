import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAccess } from "@/lib/access";
import type { Document, Highlight, Tag } from "@canopy/shared";
import { getDocument } from "@/lib/db";
import { getDocumentNote } from "@/lib/document-notes";
import { listHighlights } from "@/lib/highlights";
import { slugify } from "@/lib/slug";
import { getTagsForDocument } from "@/lib/tags";

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

function buildExportMarkdown(params: {
  doc: Document;
  tags: Tag[];
  note: string;
  highlights: Highlight[];
}) {
  const { doc, tags, note, highlights } = params;
  const frontmatterTags = tags.map((t) => `"${escapeYamlString(t.name)}"`).join(", ");

  const lines: string[] = [
    "---",
    `title: \"${escapeYamlString(doc.title)}\"`,
    `author: \"${escapeYamlString(doc.author ?? "")}\"`,
    `url: \"${escapeYamlString(doc.url ?? "")}\"`,
    `domain: \"${escapeYamlString(doc.domain ?? "")}\"`,
    `type: \"${escapeYamlString(doc.type)}\"`,
    `tags: [${frontmatterTags}]`,
    `saved: \"${escapeYamlString(doc.created_at)}\"`,
    `published: \"${escapeYamlString(doc.published_at ?? "")}\"`,
    `reading_progress: ${doc.reading_progress}`,
    "---",
    "",
    `# ${doc.title}`,
    "",
    "## Document Notes",
    note.trim() ? note : "",
    "",
    "## Highlights",
    "",
  ];

  for (const h of highlights) {
    lines.push(`> ${h.text}`);
    lines.push("");
    if (h.note?.trim()) {
      lines.push(`**Note**: ${h.note.trim()}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
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
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [tags, note, highlights] = await Promise.all([
      getTagsForDocument(env.DB, id),
      getDocumentNote(env.DB, id),
      listHighlights(env.DB, id),
    ]);

    const markdown = buildExportMarkdown({
      doc,
      tags,
      note: note?.content ?? "",
      highlights,
    });

    const base = slugify(doc.title) || "document";
    const filename = `${base}-notes.md`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
