"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { RightPanel } from "./right-panel";
import { ShortcutsHelpModal } from "@/components/keyboard/shortcuts-help-modal";
import { SearchPalette } from "@/components/search/search-palette";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Document } from "@canopy/shared";

function MenuIcon() {
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
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 10.2A5.5 5.5 0 016 2.5a5.5 5.5 0 107.7 7.7z" />
    </svg>
  );
}

type AppShellContextValue = {
  isDesktop: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  selectedDocument: Document | null;
  setSelectedDocument: (doc: Document | null) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;
  shortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  tagPickerRequest: { documentId: string; seq: number } | null;
  requestTagPicker: (documentId: string) => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShell");
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isPhone = useMediaQuery("(max-width: 767px)");

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tagPickerRequest, setTagPickerRequest] = useState<{
    documentId: string;
    seq: number;
  } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("canopy.theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("canopy.theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable) return true;
    return !!target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
    );
  }

  function toggleLeftPanel() {
    if (isDesktop) {
      setSidebarCollapsed((collapsed) => !collapsed);
      return;
    }
    setMobileSidebarOpen((open) => !open);
  }

  function toggleRightPanel() {
    setRightPanelOpen((open) => !open);
  }

  // Global shortcuts: search + help + panel toggles + save URL
  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen && !searchOpen,
    bindings: {
      "?": () => setShortcutsHelpOpen(true),
      "/": () => setSearchOpen(true),
      "[": toggleLeftPanel,
      "]": toggleRightPanel,
      n: () => setSaveDialogOpen(true),
    },
  });

  // Modifier shortcuts: Cmd/Ctrl+K search, Cmd/Ctrl+/ help.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (isEditableTarget(e.target)) return;

      // Cmd/Ctrl + / => open shortcuts help
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        (e.code === "Slash" || e.key === "/" || e.key === "?")
      ) {
        e.preventDefault();
        setShortcutsHelpOpen(true);
        return;
      }

      // Cmd/Ctrl + K => toggle search palette
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== "k") return;

      e.preventDefault();
      setSearchOpen((open) => !open);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function requestTagPicker(documentId: string) {
    setTagPickerRequest((prev) => ({
      documentId,
      seq: (prev?.seq ?? 0) + 1,
    }));
  }

  return (
    <AppShellContext.Provider
      value={{
        isDesktop,
        theme,
        toggleTheme,
        selectedDocument,
        setSelectedDocument,
        rightPanelOpen,
        setRightPanelOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        saveDialogOpen,
        setSaveDialogOpen,
        shortcutsHelpOpen,
        setShortcutsHelpOpen,
        searchOpen,
        setSearchOpen,
        tagPickerRequest,
        requestTagPicker,
      }}
    >
      {isDesktop ? (
        <div
          className="grid h-screen"
          style={{
            gridTemplateColumns: `${sidebarCollapsed ? "56px" : "240px"} 1fr${rightPanelOpen ? " 320px" : ""}`,
          }}
        >
          <Sidebar mode="desktop" />
          <main className="overflow-y-auto">{children}</main>
          {rightPanelOpen && <RightPanel />}
        </div>
      ) : (
        <div className="flex h-screen flex-col">
          <header className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSidebarCollapsed(false);
                setMobileSidebarOpen(true);
              }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </Button>
            <div className="flex-1 text-sm font-semibold text-foreground">
              Canopy
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <SearchIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
            >
              Save
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>

          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" title="Menu" className="p-0">
              <Sidebar
                mode="drawer"
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetContent
              side={isPhone ? "bottom" : "right"}
              title="Details"
              className={isPhone ? "p-0 h-[85vh]" : "p-0"}
            >
              <RightPanel />
            </SheetContent>
          </Sheet>
        </div>
      )}

      <ShortcutsHelpModal />
      <SearchPalette />
      <Toaster />
    </AppShellContext.Provider>
  );
}
