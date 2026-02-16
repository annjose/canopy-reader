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

type AppShellContextValue = {
  isDesktop: boolean;
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

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable) return true;
    return !!target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
    );
  }

  // Global shortcuts: search + help
  useKeyboardShortcuts({
    enabled: !saveDialogOpen && !shortcutsHelpOpen,
    bindings: {
      "?": () => setShortcutsHelpOpen(true),
      "/": () => setSearchOpen(true),
    },
  });

  // Cmd/Ctrl+K opens search (common command palette shortcut).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== "k") return;
      if (isEditableTarget(e.target)) return;

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
