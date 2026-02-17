"use client";

import useSWR from "swr";
import type { FeedWithCount } from "@canopy/shared";

const fetcher = <T,>(url: string): Promise<T> =>
  fetch(url).then((r) => r.json());

export function useFeeds(opts?: { folder?: string; enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;

  const sp = new URLSearchParams();
  if (opts?.folder) sp.set("folder", opts.folder);
  const qs = sp.toString();
  const url = qs ? `/api/feeds?${qs}` : "/api/feeds";

  const { data, error, isLoading, mutate } = useSWR<{ feeds: FeedWithCount[] }>(
    enabled ? url : null,
    fetcher,
  );

  return {
    feeds: data?.feeds ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useFeedFolders(opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;

  const { data, error, isLoading, mutate } = useSWR<{ folders: string[] }>(
    enabled ? "/api/feeds/folders" : null,
    fetcher,
  );

  return {
    folders: data?.folders ?? [],
    isLoading,
    error,
    mutate,
  };
}
