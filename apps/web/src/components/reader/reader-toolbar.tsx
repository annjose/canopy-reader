"use client";

import Link from "next/link";
import type { Document } from "@canopy/shared";
import { updateDocument, deleteDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@canopy/shared";
import { useAppShell } from "@/components/layout/app-shell";
import { Toc } from "./toc";

type Props = {
  document: Document;
  contentHtml: string | null;
  tocOpen: boolean;
  onTocOpenChange: (open: boolean) => void;
  onMutate: () => void;
  fontSizePx: number;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
  onResetFontSize: () => void;
};

export function ReaderToolbar({
  document: doc,
  contentHtml,
  tocOpen,
  onTocOpenChange,
  onMutate,
  fontSizePx,
  onDecreaseFontSize,
  onIncreaseFontSize,
  onResetFontSize,
}: Props) {
  const { isDesktop, rightPanelOpen, setRightPanelOpen } = useAppShell();
  async function toggleFavorite() {
    try {
      await updateDocument(doc.id, { is_favorite: doc.is_favorite ? 0 : 1 });
      toast({
        title: doc.is_favorite ? "Unfavorited" : "Favorited",
        description: doc.title,
      });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update favorite",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function archive() {
    try {
      await updateDocument(doc.id, { status: "archive" });
      toast({
        title: `Moved to ${STATUS_LABELS.archive}`,
        description: doc.title,
      });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to archive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function trash() {
    try {
      await deleteDocument(doc.id);
      toast({
        title: "Moved to Trash",
        description: doc.title,
      });
      onMutate();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to trash",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-white/95 backdrop-blur px-4 py-2">
      <Link
        href="/library"
        className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
      >
        <ArrowLeftIcon />
        Library
      </Link>

      <div className="flex-1" />

      {!isDesktop && (
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 rounded hover:bg-gray-100 text-gray-500"
          title="Info"
        >
          <InfoIcon />
        </button>
      )}

      {contentHtml && (
        <Toc
          contentHtml={contentHtml}
          open={tocOpen}
          onOpenChange={onTocOpenChange}
        />
      )}

      <div className="ml-1 mr-1 hidden sm:flex items-center rounded border border-gray-200 bg-white">
        <button
          onClick={onDecreaseFontSize}
          className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          title="Decrease font size"
          aria-label="Decrease font size"
        >
          A-
        </button>
        <button
          onClick={onResetFontSize}
          className="border-l border-r border-gray-200 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 min-w-10"
          title="Reset font size"
          aria-label="Reset font size"
        >
          {fontSizePx}
        </button>
        <button
          onClick={onIncreaseFontSize}
          className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          title="Increase font size"
          aria-label="Increase font size"
        >
          A+
        </button>
      </div>

      <button
        onClick={toggleFavorite}
        className={`p-2 rounded hover:bg-gray-100 ${doc.is_favorite ? "text-yellow-500" : "text-gray-400"}`}
        title="Favorite"
      >
        <StarIcon filled={!!doc.is_favorite} />
      </button>
      <button
        onClick={archive}
        className="p-2 rounded hover:bg-gray-100 text-gray-400"
        title="Archive"
      >
        <ArchiveIcon />
      </button>
      <button
        onClick={trash}
        className="p-2 rounded hover:bg-gray-100 text-gray-400"
        title="Trash"
      >
        <TrashIcon />
      </button>
      {doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded hover:bg-gray-100 text-gray-400"
          title="Open original"
        >
          <ExternalIcon />
        </a>
      )}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.2l-3.7 2 .7-4.1-3-2.9 4.2-.6z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2" width="13" height="3.5" rx="0.5" />
      <path d="M2.5 5.5v7.5a1 1 0 001 1h9a1 1 0 001-1V5.5" />
      <path d="M6.5 8.5h3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V3h4v1M4.5 4v8.5a1 1 0 001 1h5a1 1 0 001-1V4" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v3.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 012 12.5v-7A1.5 1.5 0 013.5 4H7" />
      <path d="M10 2h4v4M6 10L14 2" />
    </svg>
  );
}

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
