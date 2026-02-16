"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppShell } from "./app-shell";
import { useNotebook } from "@/hooks/use-notebook";
import { deleteHighlight, updateHighlight, upsertDocumentNote } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type TabKey = "info" | "notebook";

export function RightPanel() {
  const { selectedDocument: doc, setRightPanelOpen } = useAppShell();
  const [tab, setTab] = useState<TabKey>("info");

  const {
    tags,
    note,
    highlights,
    isLoading,
    error,
    mutate: mutateNotebook,
  } = useNotebook(tab === "notebook" ? doc?.id ?? null : null);

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
          tags={tags.map((t) => t.name)}
          note={note?.content ?? ""}
          highlights={highlights.map((h) => ({
            id: h.id,
            text: h.text,
            color: h.color,
            note: h.note ?? "",
          }))}
          onMutate={mutateNotebook}
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
}: {
  documentId: string;
  isLoading: boolean;
  error: unknown;
  tags: string[];
  note: string;
  highlights: { id: string; text: string; color: string; note: string }[];
  onMutate: () => void;
}) {
  const [noteDraft, setNoteDraft] = useState(note);
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    setNoteDraft(note);
  }, [note]);

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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tags
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm text-gray-400">No tags</span>
          ) : (
            tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700"
              >
                {t}
              </span>
            ))
          )}
        </div>
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
    const ok = confirm("Delete this highlight?");
    if (!ok) return;

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-gray-400 mb-1">{highlight.color}</div>
          <div className="text-sm text-gray-800">“{highlight.text}”</div>
        </div>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={deleting}
          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          title="Delete highlight"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-gray-500">Note</div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className={`rounded px-2 py-1 text-xs font-medium ${
              !dirty || saving
                ? "bg-gray-100 text-gray-400"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Add a note…"
          className="mt-2 w-full min-h-[72px] resize-y rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
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

