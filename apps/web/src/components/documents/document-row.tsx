"use client";

import Link from "next/link";
import type { Document } from "@canopy/shared";
import { updateDocument, deleteDocument } from "@/lib/api";

type Props = {
  document: Document;
  selected: boolean;
  onSelect: () => void;
  onMutate: () => void;
};

export function DocumentRow({ document: doc, selected, onSelect, onMutate }: Props) {
  async function toggleFavorite() {
    await updateDocument(doc.id, {
      is_favorite: doc.is_favorite ? 0 : 1,
    });
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
    <div
      className={`group flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-default ${
        selected ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
      onClick={onSelect}
    >
      {doc.image_url && (
        <img
          src={doc.image_url}
          alt=""
          className="h-16 w-24 flex-shrink-0 rounded object-cover"
        />
      )}

      <Link href={`/read/${doc.id}`} className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {doc.title}
        </h3>
        {doc.description && (
          <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">
            {doc.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          {doc.domain && <span>{doc.domain}</span>}
          {doc.reading_time_minutes && (
            <span>{doc.reading_time_minutes} min read</span>
          )}
        </div>
      </Link>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleFavorite}
          className={`p-1.5 rounded hover:bg-gray-200 ${doc.is_favorite ? "text-yellow-500" : "text-gray-400"}`}
          title="Favorite"
        >
          <StarIcon filled={!!doc.is_favorite} />
        </button>
        <button
          onClick={archive}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-400"
          title="Archive"
        >
          <ArchiveIcon />
        </button>
        <button
          onClick={trash}
          className="p-1.5 rounded hover:bg-gray-200 text-gray-400"
          title="Trash"
        >
          <TrashSmIcon />
        </button>
      </div>

      <span className="flex-shrink-0 text-xs text-gray-400 pt-0.5">
        {new Date(doc.created_at).toLocaleDateString()}
      </span>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.2l-3.7 2 .7-4.1-3-2.9 4.2-.6z" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2" width="13" height="3.5" rx="0.5" />
      <path d="M2.5 5.5v7.5a1 1 0 001 1h9a1 1 0 001-1V5.5" />
      <path d="M6.5 8.5h3" />
    </svg>
  );
}

function TrashSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V3h4v1M4.5 4v8.5a1 1 0 001 1h5a1 1 0 001-1V4" />
    </svg>
  );
}
