"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument, useDocumentContent } from "@/hooks/use-document";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAppShell } from "@/components/layout/app-shell";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import {
  ReaderView,
  type ReaderViewHandle,
} from "@/components/reader/reader-view";
import { ProgressBar } from "@/components/reader/progress-bar";
import { deleteDocument, updateDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@canopy/shared";
import { useEffect, useRef, useState } from "react";

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { document: doc, isLoading, mutate } = useDocument(id);
  const { content } = useDocumentContent(id);
  const router = useRouter();
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

  const readerRef = useRef<ReaderViewHandle>(null);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (doc) {
      setSelectedDocument(doc);
      if (isDesktop) setRightPanelOpen(true);
    }
    return () => {
      setSelectedDocument(null);
      setRightPanelOpen(false);
    };
  }, [doc, isDesktop, setSelectedDocument, setRightPanelOpen]);

  function scrollMainBy(deltaY: number) {
    const el = document.querySelector("main");
    if (el && el instanceof HTMLElement) {
      el.scrollBy({ top: deltaY, behavior: "smooth" });
    }
  }

  function backToList() {
    setTocOpen(false);
    // Prefer history back so you return to the same filtered list when possible.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/library");
    }
  }

  async function toggleFavorite() {
    if (!doc) return;
    try {
      await updateDocument(doc.id, { is_favorite: doc.is_favorite ? 0 : 1 });
      toast({
        title: doc.is_favorite ? "Unfavorited" : "Favorited",
        description: doc.title,
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

  async function archive() {
    if (!doc) return;
    try {
      await updateDocument(doc.id, { status: "archive" });
      toast({
        title: `Moved to ${STATUS_LABELS.archive}`,
        description: doc.title,
      });
      await mutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to archive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function trash() {
    if (!doc) return;
    try {
      await deleteDocument(doc.id);
      toast({
        title: "Moved to Trash",
        description: doc.title,
      });
      router.push("/library");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to trash",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  function openOriginal() {
    if (!doc?.url) return;
    window.open(doc.url, "_blank", "noopener,noreferrer");
  }

  function openTagEditor() {
    if (!doc) return;
    setSelectedDocument(doc);
    setRightPanelOpen(true);
    requestTagPicker(doc.id);
  }

  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen && !searchOpen,
    bindings: {
      j: () => scrollMainBy(80),
      k: () => scrollMainBy(-80),
      arrowdown: () => scrollMainBy(120),
      arrowup: () => scrollMainBy(-120),
      escape: backToList,
      u: backToList,
      s: toggleFavorite,
      e: archive,
      "#": trash,
      v: openOriginal,
      p: () => setRightPanelOpen(!rightPanelOpen),
      c: () => setTocOpen((o) => !o),
      h: () => readerRef.current?.highlightSelection(),
      t: openTagEditor,
      "?": () => setShortcutsHelpOpen(true),
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Document not found.
      </div>
    );
  }

  return (
    <>
      <ProgressBar />
      <ReaderToolbar
        document={doc}
        contentHtml={content}
        tocOpen={tocOpen}
        onTocOpenChange={setTocOpen}
        onMutate={() => mutate()}
      />

      <header className="mx-auto max-w-[680px] px-6 pt-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {doc.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {[
            doc.author,
            doc.domain,
            doc.reading_time_minutes
              ? `${doc.reading_time_minutes} min read`
              : null,
          ]
            .filter(Boolean)
            .map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 ? " • " : ""}
              </span>
            ))}
        </div>
      </header>

      <ReaderView ref={readerRef} id={id} />
    </>
  );
}
