"use client";

import { useDocumentContent } from "@/hooks/use-document";

export function ReaderView({ id }: { id: string }) {
  const { content, isLoading, error } = useDocumentContent(id);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Loading content...
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        {error ? "Failed to load content." : "No content available."}
      </div>
    );
  }

  return (
    <article
      className="article-content mx-auto max-w-[680px] px-6 py-8"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
