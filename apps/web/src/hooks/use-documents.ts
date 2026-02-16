"use client";

import useSWR from "swr";
import type { ListDocumentsParams, ListDocumentsResponse } from "@/lib/api";
import { buildDocumentsUrl } from "@/lib/api";

const fetcher = (url: string): Promise<ListDocumentsResponse> =>
  fetch(url).then((r) => r.json());

export function useDocuments(
  params: ListDocumentsParams = {},
  options: { enabled?: boolean } = {},
) {
  const url = buildDocumentsUrl(params);
  const enabled = options.enabled ?? true;
  const { data, error, isLoading, mutate } = useSWR<ListDocumentsResponse>(
    enabled ? url : null,
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
