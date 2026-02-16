"use client";

import useSWR from "swr";
import type { Document } from "@canopy/shared";

async function fetchDocument(url: string): Promise<Document> {
  const res = await fetch(url);
  return res.json();
}

async function fetchContent(url: string): Promise<{ content: string }> {
  const res = await fetch(url);
  return res.json();
}

export function useDocument(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Document>(
    id ? `/api/documents/${id}` : null,
    fetchDocument,
  );

  return { document: data, error, isLoading, mutate };
}

export function useDocumentContent(id: string | null) {
  const { data, error, isLoading } = useSWR<{ content: string }>(
    id ? `/api/documents/${id}/content` : null,
    fetchContent,
  );

  return { content: data?.content ?? null, error, isLoading };
}
