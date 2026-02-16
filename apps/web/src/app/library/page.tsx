"use client";

import { Suspense } from "react";
import { StatusTabs } from "@/components/documents/status-tabs";
import { DocumentList } from "@/components/documents/document-list";
import { SaveDialog } from "@/components/documents/save-dialog";

export default function LibraryPage() {
  return (
    <Suspense>
      <StatusTabs />
      <DocumentList />
      <SaveDialog />
    </Suspense>
  );
}
