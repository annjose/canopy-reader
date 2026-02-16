"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument, useDocumentContent } from "@/hooks/use-document";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAppShell } from "@/components/layout/app-shell";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { ReaderView } from "@/components/reader/reader-view";
import { ProgressBar } from "@/components/reader/progress-bar";
import { deleteDocument, updateDocument } from "@/lib/api";
import { useEffect, useState } from "react";

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { document: doc, isLoading, mutate } = useDocument(id);
  const { content } = useDocumentContent(id);
  const router = useRouter();
  const {
    setSelectedDocument,
    setRightPanelOpen,
    rightPanelOpen,
    saveDialogOpen,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
  } = useAppShell();

  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (doc) {
      setSelectedDocument(doc);
      setRightPanelOpen(true);
    }
    return () => {
      setSelectedDocument(null);
      setRightPanelOpen(false);
    };
  }, [doc, setSelectedDocument, setRightPanelOpen]);

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
    await updateDocument(doc.id, { is_favorite: doc.is_favorite ? 0 : 1 });
    await mutate();
  }

  async function archive() {
    if (!doc) return;
    await updateDocument(doc.id, { status: "archive" });
    await mutate();
  }

  async function trash() {
    if (!doc) return;
    await deleteDocument(doc.id);
    router.push("/library");
  }

  function openOriginal() {
    if (!doc?.url) return;
    window.open(doc.url, "_blank", "noopener,noreferrer");
  }

  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen,
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
      <ReaderView id={id} />
    </>
  );
}
