"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedWithCount, DocumentStatus } from "@canopy/shared";
import { DOCUMENT_STATUSES, STATUS_LABELS } from "@canopy/shared";
import { useDocuments } from "@/hooks/use-documents";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAppShell } from "@/components/layout/app-shell";
import { pollFeed } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DocumentRow } from "@/components/documents/document-row";

type Props = {
  feed: FeedWithCount;
  onMutateFeeds: () => void;
};

export function FeedItems({ feed, onMutateFeeds }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<DocumentStatus>("inbox");
  const [polling, setPolling] = useState(false);

  const { documents, isLoading, mutate } = useDocuments({
    feed_id: feed.id,
    status,
  });

  const {
    isDesktop,
    setSelectedDocument,
    setRightPanelOpen,
    saveDialogOpen,
    shortcutsHelpOpen,
    searchOpen,
  } = useAppShell();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDoc = useMemo(
    () => documents[selectedIndex] ?? null,
    [documents, selectedIndex],
  );

  useEffect(() => {
    if (documents.length === 0) {
      setSelectedIndex(0);
      setSelectedDocument(null);
      return;
    }
    setSelectedIndex((i) => Math.max(0, Math.min(i, documents.length - 1)));
  }, [documents.length, setSelectedDocument]);

  useEffect(() => {
    if (!selectedDoc) return;
    setSelectedDocument(selectedDoc);
    if (isDesktop) setRightPanelOpen(true);
  }, [selectedDoc, isDesktop, setSelectedDocument, setRightPanelOpen]);

  // Reset to inbox when switching feeds
  useEffect(() => {
    setStatus("inbox");
    setSelectedIndex(0);
  }, [feed.id]);

  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen && !searchOpen,
    bindings: {
      j: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.min(documents.length - 1, i + 1));
      },
      k: () => {
        if (documents.length === 0) return;
        setSelectedIndex((i) => Math.max(0, i - 1));
      },
      enter: () => {
        if (selectedDoc) router.push(`/read/${selectedDoc.id}`);
      },
      space: () => {
        if (selectedDoc) router.push(`/read/${selectedDoc.id}`);
      },
    },
  });

  async function handlePoll() {
    setPolling(true);
    try {
      const { result } = await pollFeed(feed.id);
      toast({
        title: "Feed refreshed",
        description: `${result.newItems} new item${result.newItems !== 1 ? "s" : ""}`,
      });
      await mutate();
      onMutateFeeds();
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

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-sm font-semibold text-foreground truncate">
          {feed.title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePoll}
          disabled={polling}
        >
          {polling ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b px-4 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DOCUMENT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setSelectedIndex(0); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
              status === s
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {!isLoading && documents.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No items in {STATUS_LABELS[status].toLowerCase()}.
        </div>
      )}

      {documents.map((doc, i) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          selected={i === selectedIndex}
          onSelect={() => setSelectedIndex(i)}
          onMutate={() => { void mutate(); onMutateFeeds(); }}
        />
      ))}
    </div>
  );
}
