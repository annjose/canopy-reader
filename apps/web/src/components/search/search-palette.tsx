"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocuments } from "@/hooks/use-documents";
import { useAppShell } from "@/components/layout/app-shell";

export function SearchPalette() {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useAppShell();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const params = useMemo(
    () => ({
      q: query.trim() ? query.trim() : undefined,
      sort: "created_at" as const,
      limit: 20,
    }),
    [query],
  );

  const { documents, isLoading } = useDocuments(searchOpen ? params : {});

  const selected = documents[selectedIndex] ?? null;

  useEffect(() => {
    if (!searchOpen) return;
    setQuery("");
    setSelectedIndex(0);
    // Focus after the palette is mounted.
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [searchOpen]);

  // Clamp selection as results change.
  useEffect(() => {
    if (!searchOpen) return;
    setSelectedIndex((i) => Math.max(0, Math.min(i, documents.length - 1)));
  }, [documents.length, searchOpen]);

  function close() {
    setSearchOpen(false);
  }

  function openSelected() {
    if (!selected) return;
    close();
    router.push(`/read/${selected.id}`);
  }

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/40" onClick={close} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <span className="text-sm text-gray-400">Search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, description, domain…"
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(documents.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                openSelected();
              }
            }}
          />
          <button
            onClick={close}
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Searching...
            </div>
          )}

          {!isLoading && documents.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results.
            </div>
          )}

          {!isLoading && documents.length > 0 && (
            <ul className="py-1">
              {documents.map((doc, i) => (
                <li key={doc.id}>
                  <button
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left ${
                      i === selectedIndex
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => {
                      close();
                      router.push(`/read/${doc.id}`);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {doc.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        {doc.domain && <span className="truncate">{doc.domain}</span>}
                        <span>•</span>
                        <span className="capitalize">{doc.status}</span>
                        <span>•</span>
                        <span className="capitalize">{doc.type.replace("_", " ")}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          <span className="mr-3">↑/↓ to navigate</span>
          <span className="mr-3">Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
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
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
