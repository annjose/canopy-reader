"use client";

import { useState } from "react";
import type { FeedWithCount } from "@canopy/shared";
import { useFeeds, useFeedFolders } from "@/hooks/use-feeds";
import { pollAllFeeds } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FeedRow } from "./feed-row";
import { AddFeedDialog } from "./add-feed-dialog";

type Props = {
  onSelectFeed: (feed: FeedWithCount) => void;
  selectedFeedId: string | null;
};

export function FeedList({ onSelectFeed, selectedFeedId }: Props) {
  const { feeds, isLoading, mutate } = useFeeds();
  const { folders, mutate: mutateFolders } = useFeedFolders();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [polling, setPolling] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-sm font-semibold text-foreground">Feeds</h2>
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

      {feeds.map((feed) => (
        <FeedRow
          key={feed.id}
          feed={feed}
          selected={feed.id === selectedFeedId}
          onSelect={() => onSelectFeed(feed)}
        />
      ))}

      <AddFeedDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubscribed={handleSubscribed}
        folders={folders}
      />
    </div>
  );
}
