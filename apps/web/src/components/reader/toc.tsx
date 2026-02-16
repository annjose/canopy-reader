"use client";

import { useState, useEffect } from "react";

type TocItem = { id: string; text: string; level: number };

export function Toc({ contentHtml }: { contentHtml: string }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [open, setOpen] = useState(false);

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
  }, [contentHtml]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
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
                setOpen(false);
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 3h12M2 7h8M2 11h10" />
    </svg>
  );
}
