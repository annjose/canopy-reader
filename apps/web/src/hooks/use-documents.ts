"use client";

import useSWR from "swr";
import type { ListDocumentsParams, ListDocumentsResponse } from "@/lib/api";
import { buildDocumentsUrl } from "@/lib/api";

const fetcher = (url: string): Promise<ListDocumentsResponse> =>
  fetch(url).then((r) => r.json());

export function useDocuments(params: ListDocumentsParams = {}) {
  const url = buildDocumentsUrl(params);
  const { data, error, isLoading, mutate } = useSWR<ListDocumentsResponse>(
    url,
    fetcher,
  );

  return {
    documents: data?.documents ?? [],
    nextCursor: data?.nextCursor ?? null,
    isLoading,
    error,
    mutate,
  };
}
