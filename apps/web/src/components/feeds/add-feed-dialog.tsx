"use client";

import { useState } from "react";
import { subscribeFeed } from "@/lib/api";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribed: () => void;
  folders: string[];
};

export function AddFeedDialog({ open, onOpenChange, onSubscribed, folders }: Props) {
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { feed } = await subscribeFeed(url.trim(), folder.trim() || undefined);
      toast({
        title: "Subscribed",
        description: feed.title,
      });
      setUrl("");
      setFolder("");
      onOpenChange(false);
      onSubscribed();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setUrl("");
    setFolder("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => { if (loading) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (loading) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
          <DialogDescription>
            Enter an RSS/Atom feed URL or a website URL to auto-discover the feed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            autoFocus
            disabled={loading}
            required
          />

          <div>
            <label className="text-xs text-muted-foreground">
              Folder (optional)
            </label>
            <Input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Tech, News"
              disabled={loading}
              list="feed-folders"
            />
            {folders.length > 0 && (
              <datalist id="feed-folders">
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
