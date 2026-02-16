"use client";

import { useParams } from "next/navigation";
import { useDocument, useDocumentContent } from "@/hooks/use-document";
import { useAppShell } from "@/components/layout/app-shell";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { ReaderView } from "@/components/reader/reader-view";
import { ProgressBar } from "@/components/reader/progress-bar";
import { useEffect } from "react";

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { document: doc, isLoading, mutate } = useDocument(id);
  const { content } = useDocumentContent(id);
  const { setSelectedDocument, setRightPanelOpen } = useAppShell();

  useEffect(() => {
    if (doc) {
      setSelectedDocument(doc);
      setRightPanelOpen(true);
    }
    return () => {
      setSelectedDocument(null);
      setRightPanelOpen(false);
    };
  }, [doc, setSelectedDocument, setRightPanelOpen]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  if (!doc) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Document not found.
      </div>
    );
  }

  return (
    <>
      <ProgressBar />
      <ReaderToolbar
        document={doc}
        contentHtml={content}
        onMutate={() => mutate()}
      />
      <ReaderView id={id} />
    </>
  );
}
