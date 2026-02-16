"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppShell } from "./app-shell";
import { useNotebook } from "@/hooks/use-notebook";
import { deleteHighlight, updateHighlight, upsertDocumentNote } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Tag } from "@canopy/shared";
import type { HighlightColor } from "@canopy/shared";
import { HIGHLIGHT_COLORS } from "@canopy/shared";
import { TagPickerDialog } from "@/components/tags/tag-picker-dialog";

type TabKey = "info" | "notebook";

export function RightPanel() {
  const { selectedDocument: doc, setRightPanelOpen, tagPickerRequest } =
    useAppShell();
  const [tab, setTab] = useState<TabKey>("info");

  const {
    tags,
    note,
    highlights,
    isLoading,
    error,
    mutate: mutateNotebook,
  } = useNotebook(tab === "notebook" ? doc?.id ?? null : null);

  useEffect(() => {
    if (!doc || !tagPickerRequest) return;
    if (tagPickerRequest.documentId !== doc.id) return;
    setTab("notebook");
  }, [doc, tagPickerRequest]);

  const infoRows: [string, string | null | undefined][] = useMemo(() => {
    if (!doc) return [];
    return [
      ["Title", doc.title],
      ["Author", doc.author],
      ["Domain", doc.domain],
      [
        "Published",
        doc.published_at ? new Date(doc.published_at).toLocaleDateString() : null,
      ],
      ["Word count", doc.word_count?.toLocaleString() ?? null],
      [
        "Reading time",
        doc.reading_time_minutes ? `${doc.reading_time_minutes} min` : null,
      ],
      ["Progress", `${Math.round(doc.reading_progress * 100)}%`],
      ["Saved", new Date(doc.created_at).toLocaleDateString()],
      ["Status", doc.status],
    ];
  }, [doc]);

  if (!doc) {
    return (
      <aside className="border-l border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500">Details</h2>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400"
          >
            <XIcon />
          </button>
        </div>
        <p className="text-sm text-gray-400">Select a document to see details</p>
      </aside>
    );
  }

  return (
    <aside className="border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Details</h2>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="p-1 rounded hover:bg-gray-200 text-gray-400"
          aria-label="Close details"
        >
          <XIcon />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-white p-1 border border-gray-200">
        <TabButton active={tab === "info"} onClick={() => setTab("info")}>
          Info
        </TabButton>
        <TabButton
          active={tab === "notebook"}
          onClick={() => setTab("notebook")}
        >
          Notebook
        </TabButton>
      </div>

      {tab === "info" ? (
        <InfoTab docImageUrl={doc.image_url} rows={infoRows} docUrl={doc.url} />
      ) : (
        <NotebookTab
          documentId={doc.id}
          isLoading={isLoading}
          error={error}
          tags={tags}
          note={note?.content ?? ""}
          highlights={highlights.map((h) => ({
            id: h.id,
            text: h.text,
            color: h.color,
            note: h.note ?? "",
          }))}
          onMutate={mutateNotebook}
          openTagDialogSignal={
            tagPickerRequest?.documentId === doc.id ? tagPickerRequest.seq : 0
          }
        />
      )}
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function InfoTab({
  docImageUrl,
  rows,
  docUrl,
}: {
  docImageUrl: string | null;
  rows: [string, string | null | undefined][];
  docUrl: string | null;
}) {
  return (
    <>
      {docImageUrl && (
        <img
          src={docImageUrl}
          alt=""
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      )}

      <dl className="space-y-3">
        {rows.map(
          ([label, value]) =>
            value && (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-gray-700">{value}</dd>
              </div>
            ),
        )}
      </dl>

      {docUrl && (
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block text-sm text-blue-600 hover:underline"
        >
          Open original
        </a>
      )}
    </>
  );
}

function NotebookTab({
  documentId,
  isLoading,
  error,
  tags,
  note,
  highlights,
  onMutate,
  openTagDialogSignal,
}: {
  documentId: string;
  isLoading: boolean;
  error: unknown;
  tags: Tag[];
  note: string;
  highlights: { id: string; text: string; color: string; note: string }[];
  onMutate: () => void;
  openTagDialogSignal: number;
}) {
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteSaving, setNoteSaving] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  useEffect(() => {
    setNoteDraft(note);
  }, [note]);

  useEffect(() => {
    if (!openTagDialogSignal) return;
    setTagDialogOpen(true);
  }, [openTagDialogSignal]);

  async function saveNote() {
    try {
      setNoteSaving(true);
      await upsertDocumentNote(documentId, noteDraft);
      toast({ title: "Saved note" });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save note",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setNoteSaving(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading notebook…</div>;
  }

  if (error) {
    return <div className="text-sm text-gray-400">Failed to load notebook.</div>;
  }

  const noteDirty = noteDraft !== note;

  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tags
          </h3>
          <button
            type="button"
            onClick={() => setTagDialogOpen(true)}
            className="rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Edit
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm text-gray-400">No tags</span>
          ) : (
            tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700"
                title={t.slug}
              >
                {t.name}
              </span>
            ))
          )}
        </div>

        <TagPickerDialog
          documentId={documentId}
          initialTags={tags}
          open={tagDialogOpen}
          onOpenChange={setTagDialogOpen}
          onUpdated={onMutate}
        />
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Note
          </h3>
          <button
            type="button"
            onClick={() => void saveNote()}
            disabled={!noteDirty || noteSaving}
            className={`rounded px-2 py-1 text-xs font-medium ${
              !noteDirty || noteSaving
                ? "bg-gray-100 text-gray-400"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
            title={noteDirty ? "Save note" : "No changes"}
          >
            {noteSaving ? "Saving…" : "Save"}
          </button>
        </div>

        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Write a note (markdown)…"
          className="mt-2 w-full min-h-[120px] resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-gray-300"
        />
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Highlights
        </h3>
        <div className="mt-2 space-y-3">
          {highlights.length === 0 ? (
            <div className="text-sm text-gray-400">No highlights</div>
          ) : (
            highlights.map((h) => (
              <HighlightCard
                key={h.id}
                highlight={h}
                onMutate={onMutate}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

const HL_BORDER_COLORS: Record<string, string> = {
  yellow: "border-l-yellow-400",
  blue: "border-l-blue-400",
  green: "border-l-green-400",
  red: "border-l-red-400",
  purple: "border-l-purple-400",
};

const HL_BG_COLORS: Record<string, string> = {
  yellow: "bg-yellow-50",
  blue: "bg-blue-50",
  green: "bg-green-50",
  red: "bg-red-50",
  purple: "bg-purple-50",
};

const HL_DOT_COLORS: Record<string, string> = {
  yellow: "bg-yellow-300",
  blue: "bg-blue-300",
  green: "bg-green-400",
  red: "bg-red-300",
  purple: "bg-purple-300",
};

function HighlightCard({
  highlight,
  onMutate,
}: {
  highlight: { id: string; text: string; color: string; note: string };
  onMutate: () => void;
}) {
  const [noteDraft, setNoteDraft] = useState(highlight.note);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    setNoteDraft(highlight.note);
  }, [highlight.note]);

  const dirty = noteDraft !== highlight.note;

  async function save() {
    try {
      setSaving(true);
      await updateHighlight(highlight.id, { note: noteDraft });
      toast({ title: "Saved highlight" });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update highlight",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      setDeleting(true);
      await deleteHighlight(highlight.id);
      toast({ title: "Deleted highlight" });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to delete highlight",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function changeColor(color: HighlightColor) {
    try {
      await updateHighlight(highlight.id, { color });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update color",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  function scrollToHighlight() {
    const el = document.querySelector(
      `[data-highlight-id="${highlight.id}"]`,
    );
    if (!el) return;

    // Scroll the <main> container to bring the highlight into view
    const main = document.querySelector("main");
    if (main) {
      const mainRect = main.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollTop = main.scrollTop + (elRect.top - mainRect.top) - mainRect.height / 2 + elRect.height / 2;
      main.scrollTo({ top: scrollTop, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Flash the highlight to draw attention
    el.classList.add("canopy-highlight-flash");
    setTimeout(() => el.classList.remove("canopy-highlight-flash"), 1500);
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 border-l-[3px] ${HL_BORDER_COLORS[highlight.color] ?? "border-l-yellow-400"} bg-white p-3 cursor-pointer`}
      onClick={scrollToHighlight}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`rounded px-2 py-1.5 text-sm text-gray-800 italic ${HL_BG_COLORS[highlight.color] ?? "bg-yellow-50"}`}>
            &ldquo;{highlight.text}&rdquo;
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={`inline-block h-3 w-3 rounded-full ${HL_DOT_COLORS[highlight.color] ?? "bg-yellow-300"}`}
          title={highlight.color}
        />
        {HIGHLIGHT_COLORS.filter((c) => c !== highlight.color).map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void changeColor(c);
            }}
            className={`h-3 w-3 rounded-full opacity-40 hover:opacity-100 transition-opacity ${HL_DOT_COLORS[c]}`}
            title={`Change to ${c}`}
          />
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setNoteOpen((o) => !o);
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
          title="Toggle note"
        >
          {highlight.note ? "Edit note" : "Add note"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void remove();
          }}
          disabled={deleting}
          className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
          title="Delete highlight"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>

      {(noteOpen || highlight.note) && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note..."
            className="w-full min-h-[56px] resize-y rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-gray-300"
          />
          {dirty && (
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded px-2 py-1 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

