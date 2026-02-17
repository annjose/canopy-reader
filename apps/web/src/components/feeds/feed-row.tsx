"use client";

import type { FeedWithCount } from "@canopy/shared";
import { extractDomain } from "@/lib/utils";

type Props = {
  feed: FeedWithCount;
  selected: boolean;
  onSelect: () => void;
};

export function FeedRow({ feed, selected, onSelect }: Props) {
  const domain = feed.site_url ? extractDomain(feed.site_url) : extractDomain(feed.url);

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b cursor-default ${
        selected ? "bg-muted" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0 text-muted-foreground">
        <RssSmIcon />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">
          {feed.title}
        </h3>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{domain}</span>
          <span>{feed.item_count} items</span>
          {feed.folder && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              {feed.folder}
            </span>
          )}
        </div>
      </div>

      {!feed.is_active && (
        <span className="flex-shrink-0 text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
          Paused
        </span>
      )}

      {feed.fetch_error && (
        <span
          className="flex-shrink-0 text-[11px] text-destructive bg-destructive/10 rounded px-1.5 py-0.5"
          title={feed.fetch_error}
        >
          Error
        </span>
      )}

      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {feed.last_successful_fetch_at
          ? new Date(feed.last_successful_fetch_at).toLocaleDateString()
          : "Never fetched"}
      </span>
    </div>
  );
}

function RssSmIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2 8.5a6 6 0 016 6" />
      <path d="M2 4.5a10 10 0 0110 10" />
    </svg>
  );
}
