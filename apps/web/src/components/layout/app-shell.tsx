"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";
import { RightPanel } from "./right-panel";
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
    </AppShellContext.Provider>
  );
}
