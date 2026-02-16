"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useDocuments } from "@/hooks/use-documents";
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

export function DocumentList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") ?? "inbox") as DocumentStatus;
  const sort =
    (searchParams.get("sort") as "created_at" | "published_at" | "title") ??
    "created_at";
  const type = searchParams.get("type") ?? undefined;
  const isTrashed = searchParams.get("is_trashed") === "true";
  const isFavorite = searchParams.get("is_favorite") === "true";

  const params = isTrashed
    ? { is_trashed: true, sort }
    : isFavorite
      ? { is_favorite: true, sort }
      : type
        ? { type, sort }
        : { status, sort };

  const { documents, nextCursor, isLoading, mutate } = useDocuments(params);

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
      : type
        ? `${type.charAt(0).toUpperCase()}${type.slice(1)}s`
        : null;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        {heading && (
          <h2 className="text-sm font-semibold text-gray-700">{heading}</h2>
        )}
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="text-xs text-gray-500 bg-transparent border border-gray-200 rounded px-2 py-1"
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
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          Loading...
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-gray-400">
          {isTrashed
            ? "Trash is empty."
            : isFavorite
              ? "No favorites yet."
              : EMPTY_MESSAGES[status] ?? "No documents found."}
        </div>
      )}

      {documents.map((doc) => (
        <DocumentRow key={doc.id} document={doc} onMutate={() => mutate()} />
      ))}

      {nextCursor && (
        <div className="px-4 py-3 text-center">
          <button
            onClick={() => {
              const sp = new URLSearchParams(searchParams.toString());
              sp.set("cursor", nextCursor);
              router.push(`/library?${sp.toString()}`);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
