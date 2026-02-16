"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; text: string; level: number };

type Props = {
  contentHtml: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Toc({ contentHtml, open, onOpenChange }: Props) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3");
    const extracted: TocItem[] = [];

    headings.forEach((h, i) => {
      const id = h.id || `heading-${i}`;
      extracted.push({
        id,
        text: h.textContent?.trim() || "",
        level: parseInt(h.tagName[1]!),
      });
    });

    setItems(extracted);

    // Ensure headings in the rendered article DOM have ids matching the extracted list
    // (useful when content has headings without ids).
    const applyIds = () => {
      const container = document.querySelector(".article-content");
      if (!container) return;
      const rendered = container.querySelectorAll("h1, h2, h3");
      extracted.forEach((item, idx) => {
        const el = rendered[idx] as HTMLElement | undefined;
        if (!el) return;
        if (!el.id) el.id = item.id;
      });
    };

    // Run twice to handle timing between toolbar render and article render.
    window.setTimeout(applyIds, 0);
    window.setTimeout(applyIds, 50);
  }, [contentHtml]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        className="p-2 rounded hover:bg-gray-100 text-gray-500"
        title="Table of contents"
      >
        <TocIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-50">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const el = document.getElementById(item.id);
                el?.scrollIntoView({ behavior: "smooth" });
                onOpenChange(false);
              }}
              className="block w-full text-left rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 truncate"
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TocIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 3h12M2 7h8M2 11h10" />
    </svg>
  );
}
