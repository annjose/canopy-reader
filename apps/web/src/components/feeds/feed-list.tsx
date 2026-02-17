"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedWithCount } from "@canopy/shared";
import { useFeeds, useFeedFolders } from "@/hooks/use-feeds";
import { pollAllFeeds } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FeedRow } from "./feed-row";
import { AddFeedDialog } from "./add-feed-dialog";
import { EditFeedDialog } from "./edit-feed-dialog";

export function FeedList() {
  const router = useRouter();
  const { feeds, isLoading, mutate } = useFeeds();
  const { folders, mutate: mutateFolders } = useFeedFolders();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedWithCount | null>(null);
  const [polling, setPolling] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Group feeds by folder
  const grouped = useMemo(() => {
    const noFolder: FeedWithCount[] = [];
    const byFolder = new Map<string, FeedWithCount[]>();

    for (const feed of feeds) {
      if (feed.folder) {
        const list = byFolder.get(feed.folder) ?? [];
        list.push(feed);
        byFolder.set(feed.folder, list);
      } else {
        noFolder.push(feed);
      }
    }

    // Sort folder names
    const sortedFolders = [...byFolder.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );

    return { noFolder, sortedFolders };
  }, [feeds]);

  function toggleFolder(folder: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }

  async function handleRefreshAll() {
    setPolling(true);
    try {
      const { results } = await pollAllFeeds();
      const totalNew = results.reduce((sum, r) => sum + r.newItems, 0);
      toast({
        title: "Feeds refreshed",
        description: `${totalNew} new item${totalNew !== 1 ? "s" : ""} from ${results.length} feed${results.length !== 1 ? "s" : ""}`,
      });
      await mutate();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPolling(false);
    }
  }

  function handleSubscribed() {
    void mutate();
    void mutateFolders();
  }

  function handleUpdated() {
    void mutate();
    void mutateFolders();
  }

  function handleDeleted() {
    setEditingFeed(null);
    void mutate();
    void mutateFolders();
  }

  function renderFeedRow(feed: FeedWithCount) {
    return (
      <FeedRow
        key={feed.id}
        feed={feed}
        selected={false}
        onSelect={() => router.push(`/library?feed_id=${feed.id}`)}
        onEdit={() => setEditingFeed(feed)}
        onMutate={() => void mutate()}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-sm font-semibold text-foreground">Manage Feeds</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshAll}
            disabled={polling}
            title="Refresh all feeds"
          >
            {polling ? "Refreshing..." : "Refresh all"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setAddDialogOpen(true)}
          >
            Add feed
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {!isLoading && feeds.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No feeds yet. Add a feed to get started.
        </div>
      )}

      {/* Feeds without a folder */}
      {grouped.noFolder.map(renderFeedRow)}

      {/* Folder groups */}
      {grouped.sortedFolders.map(([folder, folderFeeds]) => {
        const collapsed = collapsedFolders.has(folder);
        return (
          <div key={folder}>
            <button
              onClick={() => toggleFolder(folder)}
              className="flex w-full items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground bg-muted/50"
            >
              <ChevronIcon open={!collapsed} />
              {folder}
              <span className="font-normal normal-case tracking-normal">
                ({folderFeeds.length})
              </span>
            </button>
            {!collapsed && folderFeeds.map(renderFeedRow)}
          </div>
        );
      })}

      <AddFeedDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubscribed={handleSubscribed}
        folders={folders}
      />

      {editingFeed && (
        <EditFeedDialog
          feed={editingFeed}
          open={!!editingFeed}
          onOpenChange={(open) => { if (!open) setEditingFeed(null); }}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          folders={folders}
        />
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
    </svg>
  );
}
