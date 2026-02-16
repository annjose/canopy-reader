"use client";

import Link from "next/link";
import type { Document } from "@canopy/shared";
import { updateDocument, deleteDocument } from "@/lib/api";
import { Toc } from "./toc";

type Props = {
  document: Document;
  contentHtml: string | null;
  onMutate: () => void;
};

export function ReaderToolbar({ document: doc, contentHtml, onMutate }: Props) {
  async function toggleFavorite() {
    await updateDocument(doc.id, { is_favorite: doc.is_favorite ? 0 : 1 });
    onMutate();
  }

  async function archive() {
    await updateDocument(doc.id, { status: "archive" });
    onMutate();
  }

  async function trash() {
    await deleteDocument(doc.id);
    onMutate();
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

      {contentHtml && <Toc contentHtml={contentHtml} />}

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
