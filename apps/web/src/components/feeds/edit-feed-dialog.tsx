"use client";

import { useState } from "react";
import type { FeedWithCount } from "@canopy/shared";
import { updateFeed, deleteFeed } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  feed: FeedWithCount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onDeleted: () => void;
  folders: string[];
};

export function EditFeedDialog({
  feed,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
  folders,
}: Props) {
  const [title, setTitle] = useState(feed.title);
  const [folder, setFolder] = useState(feed.folder ?? "");
  const [isActive, setIsActive] = useState(!!feed.is_active);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form state when feed changes
  const [prevFeedId, setPrevFeedId] = useState(feed.id);
  if (feed.id !== prevFeedId) {
    setPrevFeedId(feed.id);
    setTitle(feed.title);
    setFolder(feed.folder ?? "");
    setIsActive(!!feed.is_active);
    setConfirmDelete(false);
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateFeed(feed.id, {
        title: title.trim() || feed.title,
        folder: folder.trim() || null,
        is_active: isActive ? 1 : 0,
      });
      toast({ title: "Feed updated", description: title.trim() || feed.title });
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to update feed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      await deleteFeed(feed.id);
      toast({ title: "Unsubscribed", description: feed.title });
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete feed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Feed</DialogTitle>
          <DialogDescription>
            Update feed settings or unsubscribe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Folder</label>
            <Input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Tech, News"
              disabled={loading}
              list="edit-feed-folders"
            />
            {folders.length > 0 && (
              <datalist id="edit-feed-folders">
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="feed-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="rounded"
            />
            <label htmlFor="feed-active" className="text-sm text-foreground">
              Active (poll for new items)
            </label>
          </div>

          <div className="text-xs text-muted-foreground">
            Feed URL: {feed.url}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="sm:mr-auto"
          >
            {confirmDelete ? "Confirm unsubscribe" : "Unsubscribe"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
