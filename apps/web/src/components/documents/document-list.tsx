"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAppShell } from "@/components/layout/app-shell";
import { deleteDocument, updateDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@canopy/shared";
import { Button } from "@/components/ui/button";
import { DocumentRow } from "./document-row";
import type { DocumentStatus } from "@canopy/shared";

const SORT_OPTIONS = [
  { value: "created_at", label: "Date saved" },
  { value: "published_at", label: "Date published" },
  { value: "title", label: "Title" },
] as const;

const EMPTY_MESSAGES: Record<DocumentStatus, string> = {
  inbox: "Your inbox is empty. Save an article to get started.",
  reading: "Nothing in your reading list yet.",
  later: "No articles saved for later.",
  archive: "Your archive is empty.",
};

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7v4" />
      <path d="M8 5h.01" />
    </svg>
  );
}

export function DocumentList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") ?? "inbox") as DocumentStatus;
  const sort =
    (searchParams.get("sort") as "created_at" | "published_at" | "title") ??
    "created_at";
  const type = searchParams.get("type") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const isTrashed = searchParams.get("is_trashed") === "true";
  const isFavorite = searchParams.get("is_favorite") === "true";

  const params = isTrashed
    ? { is_trashed: true, sort }
    : isFavorite
      ? { is_favorite: true, sort }
      : {
          status,
          sort,
          ...(type ? { type } : {}),
          ...(tag ? { tag } : {}),
        };

  const { documents, nextCursor, isLoading, mutate } = useDocuments(params);
  const {
    isDesktop,
    setSelectedDocument,
    setRightPanelOpen,
    rightPanelOpen,
    saveDialogOpen,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
    searchOpen,
    requestTagPicker,
  } = useAppShell();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDoc = useMemo(
    () => documents[selectedIndex] ?? null,
    [documents, selectedIndex],
  );

  // Keep selection valid as the list changes.
  useEffect(() => {
    if (documents.length === 0) {
      setSelectedIndex(0);
      setSelectedDocument(null);
      return;
    }
    setSelectedIndex((i) => Math.max(0, Math.min(i, documents.length - 1)));
  }, [documents.length, setSelectedDocument]);

  // Drive the right panel from the current selection (desktop only).
  useEffect(() => {
    if (!selectedDoc) return;
    setSelectedDocument(selectedDoc);
    if (isDesktop) setRightPanelOpen(true);
  }, [selectedDoc, isDesktop, setSelectedDocument, setRightPanelOpen]);

  async function toggleFavorite() {
    if (!selectedDoc) return;
    try {
      await updateDocument(selectedDoc.id, {
        is_favorite: selectedDoc.is_favorite ? 0 : 1,
      });
      toast({
        title: selectedDoc.is_favorite ? "Unfavorited" : "Favorited",
        description: selectedDoc.title,
      });
      await mutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update favorite",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function setStatus(next: DocumentStatus) {
    if (!selectedDoc) return;
    try {
      await updateDocument(selectedDoc.id, { status: next });
      toast({
        title: `Moved to ${STATUS_LABELS[next]}`,
        description: selectedDoc.title,
      });
      await mutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function trashSelected() {
    if (!selectedDoc) return;
    try {
      await deleteDocument(selectedDoc.id);
      toast({
        title: "Moved to Trash",
        description: selectedDoc.title,
      });
      await mutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to trash",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  function openSelected() {
    if (!selectedDoc) return;
    router.push(`/read/${selectedDoc.id}`);
  }

  function openOriginal() {
    if (!selectedDoc?.url) return;
    window.open(selectedDoc.url, "_blank", "noopener,noreferrer");
  }

  function openTagEditor() {
    if (!selectedDoc) return;
    setSelectedDocument(selectedDoc);
    setRightPanelOpen(true);
    requestTagPicker(selectedDoc.id);
  }

  function navigateToStatus(next: DocumentStatus) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("status", next);
    if (sort) sp.set("sort", sort);
    sp.delete("cursor");
    router.push(`/library?${sp.toString()}`);
  }

  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen && !searchOpen,
    bindings: {
      j: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.min(documents.length - 1, i + 1));
      },
      k: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.max(0, i - 1));
      },
      arrowdown: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.min(documents.length - 1, i + 1));
      },
      arrowup: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.max(0, i - 1));
      },
      enter: openSelected,
      space: openSelected,
      o: openOriginal,
      s: toggleFavorite,
      t: openTagEditor,
      i: () => setStatus("inbox"),
      r: () => setStatus("reading"),
      l: () => setStatus("later"),
      e: () => setStatus("archive"),
      "#": trashSelected,
      "?": () => setShortcutsHelpOpen(true),
      "g h": () => navigateToStatus("inbox"),
      "g i": () => navigateToStatus("inbox"),
      "g r": () => navigateToStatus("reading"),
      "g l": () => navigateToStatus("later"),
      "g a": () => navigateToStatus("archive"),
      "g f": () => router.push("/feeds"),
    },
  });

  function handleSort(newSort: string) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("sort", newSort);
    sp.delete("cursor");
    router.push(`/library?${sp.toString()}`);
  }

  const heading = isTrashed
    ? "Trash"
    : isFavorite
      ? "Favorites"
      : tag
        ? `Tag: ${tag}`
        : type
          ? `${type.charAt(0).toUpperCase()}${type.slice(1)}s`
          : null;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        {heading && (
          <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!isDesktop && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              disabled={!selectedDoc}
              aria-label="Details"
              title="Details"
            >
              <InfoIcon />
            </Button>
          )}
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="text-xs text-muted-foreground bg-transparent border border-input rounded px-2 py-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          {isTrashed
            ? "Trash is empty."
            : isFavorite
              ? "No favorites yet."
              : EMPTY_MESSAGES[status] ?? "No documents found."}
        </div>
      )}

      {documents.map((doc, i) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          selected={i === selectedIndex}
          onSelect={() => setSelectedIndex(i)}
          onMutate={() => mutate()}
        />
      ))}

      {nextCursor && (
        <div className="px-4 py-3 text-center">
          <button
            onClick={() => {
              const sp = new URLSearchParams(searchParams.toString());
              sp.set("cursor", nextCursor);
              router.push(`/library?${sp.toString()}`);
            }}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
