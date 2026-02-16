"use client";

import useSWR from "swr";
import type { NotebookData } from "@canopy/shared";

async function fetcher(url: string): Promise<NotebookData> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export function useNotebook(documentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<NotebookData>(
    documentId ? `/api/documents/${documentId}/notebook` : null,
    fetcher,
  );

  return {
    tags: data?.tags ?? [],
    note: data?.note ?? null,
    highlights: data?.highlights ?? [],
    isLoading,
    error,
    mutate,
  };
}
