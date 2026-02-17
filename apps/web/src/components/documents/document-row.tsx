"use client";

import Link from "next/link";
import type { Document } from "@canopy/shared";
import { updateDocument, deleteDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { STATUS_LABELS } from "@canopy/shared";

type Props = {
  document: Document;
  selected: boolean;
  onSelect: () => void;
  onMutate: () => void;
};

export function DocumentRow({ document: doc, selected, onSelect, onMutate }: Props) {
  const dateStr = new Date(doc.created_at).toLocaleDateString();
  async function toggleFavorite() {
    try {
      await updateDocument(doc.id, {
        is_favorite: doc.is_favorite ? 0 : 1,
      });
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
    <div
      className={`group flex items-start gap-3 px-4 py-3 border-b cursor-default ${
        selected ? "bg-muted" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      {doc.image_url && (
        <img
          src={doc.image_url}
          alt=""
          className="h-14 w-20 sm:h-16 sm:w-24 flex-shrink-0 rounded object-cover"
        />
      )}

      <Link href={`/read/${doc.id}`} className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">
          {doc.title}
        </h3>
        {doc.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {doc.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {doc.feed_title && (
            <span className="whitespace-nowrap font-medium">{doc.feed_title}</span>
          )}
          {doc.domain && <span className="whitespace-nowrap">{doc.domain}</span>}
          {doc.reading_time_minutes && (
            <span className="whitespace-nowrap">
              {doc.reading_time_minutes} min read
            </span>
          )}
          {doc.tags && doc.tags.length > 0 && (
            <>
              {doc.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
              {doc.tags.length > 3 && (
                <span className="text-[11px]">
                  +{doc.tags.length - 3}
                </span>
              )}
            </>
          )}
          <span className="sm:hidden whitespace-nowrap">{dateStr}</span>
        </div>
      </Link>

      <div className="hidden lg:flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleFavorite();
          }}
          className={`p-1.5 rounded hover:bg-accent ${doc.is_favorite ? "text-yellow-500" : "text-muted-foreground"}`}
          title="Favorite"
        >
          <StarIcon filled={!!doc.is_favorite} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void archive();
          }}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground"
          title="Archive"
        >
          <ArchiveIcon />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void trash();
          }}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground"
          title="Trash"
        >
          <TrashSmIcon />
        </button>
      </div>

      <span className="hidden sm:block flex-shrink-0 text-xs text-muted-foreground pt-0.5">
        {dateStr}
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
