"use client";

import { useAppShell } from "@/components/layout/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShortcutsHelpModal() {
  const { shortcutsHelpOpen, setShortcutsHelpOpen } = useAppShell();

  return (
    <Dialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="sr-only">
            List of keyboard shortcuts for the library and reader views.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Library">
            <Shortcut k="/" d="Search" />
            <Shortcut k="Ctrl/⌘ K" d="Search (command palette)" />
            <Shortcut k="Ctrl/⌘ /" d="Show keyboard shortcuts" />
            <Shortcut k="n" d="Save URL" />
            <Shortcut k="[ / ]" d="Toggle left / right panel" />
            <div className="mt-3" />
            <Shortcut k="j / k" d="Next / previous item" />
            <Shortcut k="↑ / ↓" d="Next / previous item" />
            <Shortcut k="Enter / Space" d="Open selected item" />
            <Shortcut k="o" d="Open original URL" />
            <Shortcut k="i" d="Move to Inbox" />
            <Shortcut k="r" d="Move to Reading" />
            <Shortcut k="l" d="Move to Later" />
            <Shortcut k="e" d="Move to Archive" />
            <Shortcut k="s" d="Toggle favorite" />
            <Shortcut k="t" d="Edit tags" />
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
            <Shortcut k="Ctrl/⌘ /" d="Show keyboard shortcuts" />
            <Shortcut k="n" d="Save URL" />
            <Shortcut k="[ / ]" d="Toggle left / right panel" />
            <div className="mt-3" />
            <Shortcut k="j / k" d="Scroll down / up" />
            <Shortcut k="↑ / ↓" d="Scroll up / down" />
            <Shortcut k="u / Esc" d="Back to list" />
            <Shortcut k="s" d="Toggle favorite" />
            <Shortcut k="e" d="Archive" />
            <Shortcut k="#" d="Trash" />
            <Shortcut k="o" d="Open original URL" />
            <Shortcut k="p" d="Toggle right panel" />
            <Shortcut k="c" d="Toggle table of contents" />
            <Shortcut k="h" d="Highlight selected text" />
            <Shortcut k="t" d="Edit tags" />
            <Shortcut k="?" d="Show this help" />
          </Section>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: shortcuts are disabled while typing in inputs.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Shortcut({ k, d }: { k: string; d: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
        {k}
      </kbd>
      <span className="text-sm text-muted-foreground">{d}</span>
    </div>
  );
}
