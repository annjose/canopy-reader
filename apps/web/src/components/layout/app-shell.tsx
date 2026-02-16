"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { RightPanel } from "./right-panel";
import { ShortcutsHelpModal } from "@/components/keyboard/shortcuts-help-modal";
import { SearchPalette } from "@/components/search/search-palette";
import { Toaster } from "@/components/ui/toaster";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Document } from "@canopy/shared";

type AppShellContextValue = {
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
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShell");
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <AppShellContext.Provider
      value={{
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
      }}
    >
      <div
        className="grid h-screen"
        style={{
          gridTemplateColumns: `${sidebarCollapsed ? "56px" : "240px"} 1fr${rightPanelOpen ? " 320px" : ""}`,
        }}
      >
        <Sidebar />
        <main className="overflow-y-auto">{children}</main>
        {rightPanelOpen && <RightPanel />}
      </div>
      <ShortcutsHelpModal />
      <SearchPalette />
      <Toaster />
    </AppShellContext.Provider>
  );
}
