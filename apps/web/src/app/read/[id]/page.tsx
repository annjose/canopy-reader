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
import { useCallback, useEffect, useRef, useState } from "react";

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
  const progressDebounceRef = useRef<number | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [fontSizePx, setFontSizePx] = useState(18);

  const FONT_SIZE_KEY = "canopy.reader.fontSizePx";
  const FONT_SIZE_MIN = 14;
  const FONT_SIZE_MAX = 24;
  const FONT_SIZE_STEP = 1;
  const FONT_SIZE_DEFAULT = 18;

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

  useEffect(() => {
    const raw = window.localStorage.getItem(FONT_SIZE_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(parsed, FONT_SIZE_MIN), FONT_SIZE_MAX);
    setFontSizePx(clamped);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FONT_SIZE_KEY, String(fontSizePx));
  }, [fontSizePx]);

  const computeProgress = useCallback((el: HTMLElement) => {
    const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 0);
    if (maxScroll <= 0) return 0;
    return Math.min(Math.max(el.scrollTop / maxScroll, 0), 1);
  }, []);

  const buildLastReadPosition = useCallback((el: HTMLElement, progress: number) => {
    return JSON.stringify({
      scrollTop: Math.max(el.scrollTop, 0),
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      progress,
      savedAt: new Date().toISOString(),
    });
  }, []);

  const persistReadingProgress = useCallback(
    async (force = false) => {
      if (!doc) return;
      const el = document.querySelector("main");
      if (!(el instanceof HTMLElement)) return;

      const progress = computeProgress(el);
      const previous = lastSavedProgressRef.current;

      // Ignore tiny changes unless explicitly forced.
      if (!force && Math.abs(progress - previous) < 0.01) {
        return;
      }

      const lastReadPosition = buildLastReadPosition(el, progress);

      try {
        await updateDocument(doc.id, {
          reading_progress: progress,
          last_read_position: lastReadPosition,
        });
        lastSavedProgressRef.current = progress;

        // Keep local document data in sync without forcing revalidation.
        await mutate(
          (current) =>
            current
              ? {
                  ...current,
                  reading_progress: progress,
                  last_read_position: lastReadPosition,
                }
              : current,
          false,
        );
      } catch {
        // Best effort only; reading should continue even if save fails.
      }
    },
    [buildLastReadPosition, computeProgress, doc, mutate],
  );

  // Restore last scroll position on open (best effort).
  useEffect(() => {
    if (!doc || !content) return;
    const el = document.querySelector("main");
    if (!(el instanceof HTMLElement)) return;

    const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 0);
    let target = 0;

    if (doc.last_read_position) {
      try {
        const parsed = JSON.parse(doc.last_read_position) as {
          scrollTop?: number;
          progress?: number;
        };
        if (typeof parsed.scrollTop === "number") {
          target = parsed.scrollTop;
        } else if (typeof parsed.progress === "number") {
          target = parsed.progress * maxScroll;
        }
      } catch {
        // ignore invalid stored JSON
      }
    }

    if (target <= 0 && doc.reading_progress > 0) {
      target = doc.reading_progress * maxScroll;
    }

    if (target > 0) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: Math.min(target, maxScroll), behavior: "auto" });
      });
    }

    lastSavedProgressRef.current = doc.reading_progress ?? 0;
  }, [content, doc]);

  // Debounced reading progress persistence.
  useEffect(() => {
    if (!doc) return;

    const el = document.querySelector("main");
    if (!(el instanceof HTMLElement)) return;

    function onScroll() {
      if (progressDebounceRef.current) {
        window.clearTimeout(progressDebounceRef.current);
      }

      progressDebounceRef.current = window.setTimeout(() => {
        void persistReadingProgress(false);
      }, 1500);
    }

    function flushNow() {
      if (progressDebounceRef.current) {
        window.clearTimeout(progressDebounceRef.current);
        progressDebounceRef.current = null;
      }
      void persistReadingProgress(true);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("pagehide", flushNow);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", flushNow);
      window.removeEventListener("pagehide", flushNow);
      flushNow();
    };
  }, [doc, persistReadingProgress]);

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

  function decreaseFontSize() {
    setFontSizePx((s) => Math.max(FONT_SIZE_MIN, s - FONT_SIZE_STEP));
  }

  function increaseFontSize() {
    setFontSizePx((s) => Math.min(FONT_SIZE_MAX, s + FONT_SIZE_STEP));
  }

  function resetFontSize() {
    setFontSizePx(FONT_SIZE_DEFAULT);
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
        fontSizePx={fontSizePx}
        onDecreaseFontSize={decreaseFontSize}
        onIncreaseFontSize={increaseFontSize}
        onResetFontSize={resetFontSize}
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

      <ReaderView ref={readerRef} id={id} fontSizePx={fontSizePx} />
    </>
  );
}
