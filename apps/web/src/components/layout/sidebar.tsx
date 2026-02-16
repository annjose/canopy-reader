"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAppShell } from "./app-shell";

const NAV_ITEMS = [
  { label: "Home", href: "/library", icon: HomeIcon },
  { label: "Tags", href: "/tags", icon: TagIcon },
  { label: "Favorites", href: "/library?is_favorite=true", icon: StarIcon },
  { label: "Trash", href: "/library?is_trashed=true", icon: TrashIcon },
];

const LIBRARY_ITEMS = [
  { label: "Articles", href: "/library?type=article", icon: ArticleIcon },
  { label: "Books", href: "/library?type=book", icon: BookIcon },
  { label: "PDFs", href: "/library?type=pdf", icon: PdfIcon },
  { label: "Emails", href: "/library?type=email", icon: EmailIcon },
];

export function Sidebar({
  mode = "desktop",
  onNavigate,
}: {
  mode?: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    setSaveDialogOpen,
    theme,
    toggleTheme,
  } = useAppShell();
  const [libraryOpen, setLibraryOpen] = useState(true);

  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  function isActive(href: string) {
    if (href === "/library") {
      return currentUrl === "/library" || currentUrl === "/library?status=inbox";
    }
    return currentUrl === href;
  }

  if (mode === "desktop" && sidebarCollapsed) {
    return (
      <aside className="flex flex-col items-center border-r bg-muted py-3 gap-2">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 rounded hover:bg-accent text-muted-foreground"
          title="Expand sidebar"
        >
          <MenuIcon />
        </button>
        <button
          onClick={() => {
            setSaveDialogOpen(true);
            onNavigate?.();
          }}
          className="p-2 rounded hover:bg-accent text-muted-foreground"
          title="Save URL"
        >
          <PlusIcon />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-accent text-muted-foreground"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col border-r bg-muted overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/library"
          className="text-lg font-semibold text-foreground"
          onClick={() => onNavigate?.()}
        >
          Canopy
        </Link>
        {mode === "desktop" && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            title="Collapse sidebar"
          >
            <MenuIcon />
          </button>
        )}
      </div>

      <div className="px-3 mb-3">
        <button
          onClick={() => {
            setSaveDialogOpen(true);
            onNavigate?.();
          }}
          className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon />
          Save
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
              isActive(item.href)
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <item.icon />
            {item.label}
          </Link>
        ))}

        <div className="pt-3">
          <button
            onClick={() => setLibraryOpen(!libraryOpen)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronIcon open={libraryOpen} />
            Library
          </button>
          {libraryOpen && (
            <div className="space-y-0.5 mt-0.5">
              {LIBRARY_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                    isActive(item.href)
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t p-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}

// --- Inline SVG Icons (16x16) ---

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l6-5.5L14 8M3.5 9v4.5h3.25V11h2.5v2.5h3.25V9" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M8 2l1.8 3.6L14 6.2l-3 2.9.7 4.1L8 11.2l-3.7 2 .7-4.1-3-2.9 4.2-.6z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5V2.5h4l7 7-4 4-7-7z" />
      <circle cx="5.2" cy="5.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V3h4v1M4.5 4v8.5a1 1 0 001 1h5a1 1 0 001-1V4" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <path d="M5 5h6M5 8h6M5 11h3" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5h4.5a1.5 1.5 0 011.5 1.5v9.5S7 12.5 4.5 12.5H2zM14 2.5H9.5A1.5 1.5 0 008 4v9.5s1-1 3.5-1H14z" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6z" />
      <path d="M9 1.5V6h4.5" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="M1.5 4.5L8 9l6.5-4.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 10.2A5.5 5.5 0 016 2.5a5.5 5.5 0 107.7 7.7z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
    </svg>
  );
}
