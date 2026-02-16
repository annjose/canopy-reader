"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDocument } from "@/lib/api";
import { useAppShell } from "@/components/layout/app-shell";
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
import { toast } from "@/hooks/use-toast";

export function SaveDialog() {
  const { saveDialogOpen, setSaveDialogOpen } = useAppShell();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const doc = await saveDocument(url.trim());
      toast({
        title: "Saved",
        description: doc.title || "Saved article",
      });
      setUrl("");
      setSaveDialogOpen(false);
      router.push(`/read/${doc.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setUrl("");
    setError(null);
    setSaveDialogOpen(false);
  }

  return (
    <Dialog
      open={saveDialogOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setSaveDialogOpen(true);
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Save a URL</DialogTitle>
          <DialogDescription>
            Paste a link and Canopy will extract a readable version.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            autoFocus
            disabled={loading}
            required
          />

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
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
