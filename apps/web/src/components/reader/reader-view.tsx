"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useDocumentContent } from "@/hooks/use-document";
import { createHighlight } from "@/lib/api";
import { HIGHLIGHT_COLORS } from "@canopy/shared";
import type { HighlightColor } from "@canopy/shared";
import { toast } from "@/hooks/use-toast";

type PopoverState = {
  open: boolean;
  text: string;
  x: number;
  y: number;
};

export function ReaderView({ id }: { id: string }) {
  const { mutate } = useSWRConfig();
  const { content, isLoading, error } = useDocumentContent(id);

  const articleRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [popover, setPopover] = useState<PopoverState>({
    open: false,
    text: "",
    x: 0,
    y: 0,
  });
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const notebookKey = useMemo(() => `/api/documents/${id}/notebook`, [id]);

  function closePopover() {
    setPopover((p) => ({ ...p, open: false }));
    setNote("");
    setColor("yellow");
  }

  function selectionInfo(): { text: string; x: number; y: number } | null {
    const container = articleRef.current;
    if (!container) return null;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

    const text = sel.toString().trim();
    if (!text) return null;

    const range = sel.getRangeAt(0);

    // Ensure selection is within article content.
    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    if (
      !anchorNode ||
      !focusNode ||
      !container.contains(anchorNode) ||
      !container.contains(focusNode)
    ) {
      return null;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    return { text, x: rect.left + rect.width / 2, y: rect.top };
  }

  useEffect(() => {
    function onMouseUp() {
      // Let selection settle.
      window.setTimeout(() => {
        const info = selectionInfo();
        if (!info) {
          // If selection is cleared, also hide popover.
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) closePopover();
          return;
        }
        setPopover({ open: true, text: info.text, x: info.x, y: info.y });
      }, 0);
    }

    function onScroll() {
      if (popover.open) closePopover();
    }

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      // Clicking outside should close popover.
      if (popover.open) closePopover();
    }

    // Listen on the document so selections that end outside the article still
    // trigger (as long as the selection itself is within the article).
    document.addEventListener("mouseup", onMouseUp);

    // Close popover if scrolling main content.
    const main = document.querySelector("main");
    main?.addEventListener("scroll", onScroll, { passive: true });

    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      main?.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [content, popover.open]);

  async function saveHighlight() {
    if (!popover.open || !popover.text.trim()) return;

    try {
      setSaving(true);
      await createHighlight(id, {
        text: popover.text,
        color,
        note: note.trim() ? note : null,
        position_data: JSON.stringify({ quote: popover.text }),
      });

      toast({ title: "Saved highlight" });

      // Refresh notebook panel if open.
      await mutate(notebookKey);

      // Clear selection + popover.
      window.getSelection()?.removeAllRanges();
      closePopover();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to save highlight",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Loading content...
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        {error ? "Failed to load content." : "No content available."}
      </div>
    );
  }

  return (
    <>
      <article
        ref={articleRef}
        className="article-content mx-auto max-w-[680px] px-6 py-8"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {popover.open && (
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-lg border border-gray-200 bg-white shadow-lg p-2 w-[280px]"
          style={{
            left: popover.x,
            top: popover.y - 10,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => {
            // Prevent click from clearing selection before we save.
            e.preventDefault();
          }}
        >
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded border ${
                  color === c ? "border-gray-900" : "border-gray-200"
                }`}
                title={c}
              >
                <span
                  className={`block h-full w-full rounded ${highlightSwatchClass(c)}`}
                />
              </button>
            ))}
            <div className="flex-1" />
            <button
              type="button"
              onClick={closePopover}
              className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
            >
              Esc
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 line-clamp-2">
            “{popover.text}”
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)…"
            className="mt-2 w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-300"
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closePopover}
              className="rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveHighlight()}
              className="rounded px-3 py-1.5 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function highlightSwatchClass(c: HighlightColor): string {
  switch (c) {
    case "yellow":
      return "bg-yellow-200";
    case "blue":
      return "bg-blue-200";
    case "green":
      return "bg-green-200";
    case "red":
      return "bg-red-200";
    case "purple":
      return "bg-purple-200";
  }
}
