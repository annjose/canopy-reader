"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSWRConfig } from "swr";
import { useDocumentContent } from "@/hooks/use-document";
import { useNotebook } from "@/hooks/use-notebook";
import {
  createHighlight,
  deleteHighlight,
  updateHighlight,
} from "@/lib/api";
import type { HighlightColor } from "@canopy/shared";
import { toast } from "@/hooks/use-toast";
import {
  HighlightToolbar,
  type ToolbarMode,
} from "./highlight-toolbar";

export type ReaderViewHandle = {
  highlightSelection: () => void;
};

type ToolbarState = ToolbarMode | null;

export const ReaderView = forwardRef<ReaderViewHandle, { id: string }>(
  function ReaderView({ id }, ref) {
    const { mutate } = useSWRConfig();
    const { content, isLoading, error } = useDocumentContent(id);
    const { highlights } = useNotebook(id);

    const articleRef = useRef<HTMLElement>(null);
    const toolbarRef = useRef<HTMLDivElement | null>(null);

    const [toolbar, setToolbar] = useState<ToolbarState>(null);
    const [saving, setSaving] = useState(false);

    const notebookKey = useMemo(() => `/api/documents/${id}/notebook`, [id]);

    // Memoize the dangerouslySetInnerHTML object so React doesn't reset the
    // article DOM on unrelated state changes (toolbar, saving, etc.).
    // Without this, every re-render creates a new { __html } object which
    // causes React to re-apply innerHTML, wiping highlight spans.
    const articleHtml = useMemo(
      () => (content ? { __html: content } : undefined),
      [content],
    );

    // Remove temporary pending-highlight spans
    const clearPendingHighlight = useCallback(() => {
      const container = articleRef.current;
      if (!container) return;
      const pending = container.querySelectorAll<HTMLElement>(
        ".canopy-highlight-pending",
      );
      pending.forEach((span) => {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      });
      container.normalize();
    }, []);

    const closeToolbar = useCallback(() => {
      clearPendingHighlight();
      setToolbar((prev) => {
        if (!prev) return prev;
        return null;
      });
    }, [clearPendingHighlight]);

    function selectionInfo(): { text: string; x: number; y: number } | null {
      const container = articleRef.current;
      if (!container) return null;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

      const text = sel.toString().trim();
      if (!text) return null;

      const range = sel.getRangeAt(0);

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

    // Expose highlightSelection for the `h` keyboard shortcut.
    useImperativeHandle(
      ref,
      () => ({
        highlightSelection() {
          const info = selectionInfo();
          if (!info) return;
          void doCreateHighlight(id, info.text, "yellow", null, notebookKey);
        },
      }),
      [id, notebookKey],
    );

    // --- In-text highlight rendering (best-effort)
    useEffect(() => {
      if (toolbar) return;
      const container = articleRef.current;
      if (!container) return;

      clearRenderedHighlights(container);

      for (const h of highlights) {
        const quote = h.text?.trim();
        if (!quote) continue;
        renderHighlight(container, quote, h.color, h.id);
      }
      // Single normalize after all highlights are rendered
      container.normalize();
    }, [highlights, toolbar]);

    // --- Mouse event listeners
    useEffect(() => {
      function onMouseUp(e: MouseEvent) {
        // Clicks inside the toolbar should not interfere
        const target = e.target as Node | null;
        if (target && toolbarRef.current?.contains(target)) return;

        window.setTimeout(() => {
          const info = selectionInfo();
          if (!info) {
            if (toolbar) closeToolbar();
            return;
          }

          // Render a temporary pending highlight using text-matching
          // (same reliable approach as saved highlights)
          clearPendingHighlight();
          const container = articleRef.current;
          if (container) {
            renderPendingHighlight(container, info.text);
            container.normalize();
          }
          window.getSelection()?.removeAllRanges();

          setToolbar({
            mode: "new",
            text: info.text,
            x: info.x,
            y: info.y,
          });
        }, 0);
      }

      function onMouseDown(e: MouseEvent) {
        const target = e.target as Node | null;
        if (!target) return;
        if (toolbarRef.current?.contains(target)) return;

        // Check if clicking an existing highlight span
        const hlSpan = (target as HTMLElement).closest?.(
          ".canopy-highlight[data-highlight-id]",
        );
        if (hlSpan) {
          e.preventDefault();
          // Clear any text selection so toolbar shows in edit mode
          window.getSelection()?.removeAllRanges();
          const highlightId = hlSpan.getAttribute("data-highlight-id")!;
          const color = (hlSpan.getAttribute("data-color") as HighlightColor) || "yellow";
          const rect = hlSpan.getBoundingClientRect();
          // Find the note for this highlight
          const match = highlights.find((h) => h.id === highlightId);
          setToolbar({
            mode: "edit",
            highlightId,
            color,
            note: match?.note ?? "",
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
          return;
        }

        if (toolbar) closeToolbar();
      }

      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("mousedown", onMouseDown);

      return () => {
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousedown", onMouseDown);
      };
    }, [content, toolbar, highlights, closeToolbar]);

    // --- Create highlight action
    async function doCreateHighlight(
      docId: string,
      text: string,
      color: HighlightColor,
      note: string | null,
      nbKey: string,
    ) {
      try {
        setSaving(true);
        await createHighlight(docId, {
          text,
          color,
          note,
          position_data: JSON.stringify({ quote: text }),
        });
        toast({ title: "Saved highlight" });
        await mutate(nbKey);
        window.getSelection()?.removeAllRanges();
        closeToolbar();
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

    // --- Toolbar callbacks
    function handleHighlight(color: HighlightColor, note: string | null) {
      if (toolbar?.mode !== "new") return;
      void doCreateHighlight(id, toolbar.text, color, note, notebookKey);
    }

    async function handleDelete() {
      if (toolbar?.mode !== "edit") return;
      try {
        setSaving(true);
        await deleteHighlight(toolbar.highlightId);
        toast({ title: "Deleted highlight" });
        await mutate(notebookKey);
        closeToolbar();
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to delete highlight",
          description: e instanceof Error ? e.message : "Unknown error",
        });
      } finally {
        setSaving(false);
      }
    }

    async function handleChangeColor(color: HighlightColor) {
      if (toolbar?.mode !== "edit") return;
      try {
        setSaving(true);
        await updateHighlight(toolbar.highlightId, { color });
        await mutate(notebookKey);
        setToolbar((prev) =>
          prev?.mode === "edit" ? { ...prev, color } : prev,
        );
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to update color",
          description: e instanceof Error ? e.message : "Unknown error",
        });
      } finally {
        setSaving(false);
      }
    }

    async function handleUpdateNote(note: string) {
      if (toolbar?.mode !== "edit") return;
      try {
        setSaving(true);
        await updateHighlight(toolbar.highlightId, { note });
        toast({ title: "Saved note" });
        await mutate(notebookKey);
        setToolbar((prev) =>
          prev?.mode === "edit" ? { ...prev, note } : prev,
        );
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to update note",
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
          dangerouslySetInnerHTML={articleHtml}
        />

        {toolbar && (
          <div ref={toolbarRef}>
            <HighlightToolbar
              state={toolbar}
              saving={saving}
              onHighlight={handleHighlight}
              onChangeColor={handleChangeColor}
              onDelete={() => void handleDelete()}
              onUpdateNote={handleUpdateNote}
              onClose={closeToolbar}
            />
          </div>
        )}
      </>
    );
  },
);

// --- In-text highlight DOM helpers (best-effort quote matching)

function clearRenderedHighlights(container: HTMLElement) {
  const spans = container.querySelectorAll<HTMLElement>(
    'span[data-canopy-highlight="true"]',
  );
  spans.forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
  });
  container.normalize();
}

function canonicalize(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/[\u2009\u202f]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"');
}

function renderHighlight(
  container: HTMLElement,
  quote: string,
  color: HighlightColor,
  highlightId: string,
): boolean {
  const canonQuote = canonicalize(quote);

  // Try block-level search first
  const blocks = container.querySelectorAll<HTMLElement>(
    "p, li, blockquote, h1, h2, h3, h4, h5, h6",
  );

  for (const block of Array.from(blocks)) {
    if (tryWrapInContext(block, canonQuote, color, highlightId)) {
      return true;
    }
  }

  // Cross-block fallback: search entire container
  if (tryWrapInContext(container, canonQuote, color, highlightId)) {
    return true;
  }

  return false;
}

function renderPendingHighlight(
  container: HTMLElement,
  quote: string,
): boolean {
  const canonQuote = canonicalize(quote);

  const blocks = container.querySelectorAll<HTMLElement>(
    "p, li, blockquote, h1, h2, h3, h4, h5, h6",
  );

  for (const block of Array.from(blocks)) {
    if (tryWrapPending(block, canonQuote)) return true;
  }
  if (tryWrapPending(container, canonQuote)) return true;
  return false;
}

function tryWrapPending(
  context: HTMLElement,
  canonQuote: string,
): boolean {
  const nodes = getTextNodes(context);
  if (nodes.length === 0) return false;

  const raw = nodes.map((n) => n.nodeValue ?? "").join("");
  const canonRaw = canonicalize(raw);
  const idx = canonRaw.indexOf(canonQuote);
  if (idx === -1) return false;

  const start = locateTextOffset(nodes, idx);
  const end = locateTextOffset(nodes, idx + canonQuote.length);
  if (!start || !end) return false;

  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    const span = document.createElement("span");
    span.className = "canopy-highlight-pending";

    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
    range.detach();
    return true;
  } catch {
    return false;
  }
}

function tryWrapInContext(
  context: HTMLElement,
  canonQuote: string,
  color: HighlightColor,
  highlightId: string,
): boolean {
  const nodes = getTextNodes(context);
  if (nodes.length === 0) return false;

  const raw = nodes.map((n) => n.nodeValue ?? "").join("");
  const canonRaw = canonicalize(raw);
  const idx = canonRaw.indexOf(canonQuote);
  if (idx === -1) return false;

  const start = locateTextOffset(nodes, idx);
  const end = locateTextOffset(nodes, idx + canonQuote.length);
  if (!start || !end) return false;

  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    const span = document.createElement("span");
    span.setAttribute("data-canopy-highlight", "true");
    span.setAttribute("data-color", color);
    span.setAttribute("data-highlight-id", highlightId);
    span.className = "canopy-highlight";

    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
    range.detach();

    // No normalize here — done once after the full loop
    return true;
  } catch {
    return false;
  }
}

function getTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;

      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      if (parent.closest('span[data-canopy-highlight="true"]')) {
        return NodeFilter.FILTER_REJECT;
      }

      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) {
    nodes.push(n as Text);
  }

  return nodes;
}

function locateTextOffset(
  nodes: Text[],
  absoluteOffset: number,
): { node: Text; offset: number } | null {
  let remaining = absoluteOffset;
  for (const node of nodes) {
    const len = node.nodeValue?.length ?? 0;
    if (remaining <= len) {
      return { node, offset: remaining };
    }
    remaining -= len;
  }
  return null;
}
