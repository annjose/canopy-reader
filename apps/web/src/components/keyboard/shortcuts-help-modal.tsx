"use client";

import { useEffect } from "react";
import { useAppShell } from "@/components/layout/app-shell";

export function ShortcutsHelpModal() {
  const { shortcutsHelpOpen, setShortcutsHelpOpen } = useAppShell();

  useEffect(() => {
    if (!shortcutsHelpOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setShortcutsHelpOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcutsHelpOpen, setShortcutsHelpOpen]);

  if (!shortcutsHelpOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh]">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => setShortcutsHelpOpen(false)}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Keyboard shortcuts
          </h2>
          <button
            onClick={() => setShortcutsHelpOpen(false)}
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Section title="Library">
            <Shortcut k="/" d="Search" />
            <Shortcut k="Ctrl/⌘ K" d="Search (command palette)" />
            <div className="mt-3" />
            <Shortcut k="j / k" d="Next / previous item" />
            <Shortcut k="↑ / ↓" d="Next / previous item" />
            <Shortcut k="Enter / o" d="Open selected item" />
            <Shortcut k="v" d="Open original URL" />
            <Shortcut k="i" d="Move to Inbox" />
            <Shortcut k="r" d="Move to Reading" />
            <Shortcut k="l" d="Move to Later" />
            <Shortcut k="e" d="Move to Archive" />
            <Shortcut k="s" d="Toggle favorite" />
            <Shortcut k="#" d="Move to Trash" />
            <div className="mt-3" />
            <Shortcut k="g h" d="Go to Library" />
            <Shortcut k="g i" d="Go to Inbox" />
            <Shortcut k="g r" d="Go to Reading" />
            <Shortcut k="g l" d="Go to Later" />
            <Shortcut k="g a" d="Go to Archive" />
            <Shortcut k="?" d="Show this help" />
          </Section>

          <Section title="Reader">
            <Shortcut k="/" d="Search" />
            <Shortcut k="Ctrl/⌘ K" d="Search (command palette)" />
            <div className="mt-3" />
            <Shortcut k="j / k" d="Scroll down / up" />
            <Shortcut k="↑ / ↓" d="Scroll up / down" />
            <Shortcut k="u / Esc" d="Back to list" />
            <Shortcut k="s" d="Toggle favorite" />
            <Shortcut k="e" d="Archive" />
            <Shortcut k="#" d="Trash" />
            <Shortcut k="v" d="Open original URL" />
            <Shortcut k="p" d="Toggle right panel" />
            <Shortcut k="c" d="Toggle table of contents" />
            <Shortcut k="?" d="Show this help" />
          </Section>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Tip: shortcuts are disabled while typing in inputs.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Shortcut({ k, d }: { k: string; d: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <kbd className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
        {k}
      </kbd>
      <span className="text-sm text-gray-600">{d}</span>
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
