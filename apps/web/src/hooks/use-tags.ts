"use client";

import useSWR from "swr";
import type { TagWithCount } from "@canopy/shared";

async function fetcher(url: string): Promise<{ tags: TagWithCount[] }> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR<{ tags: TagWithCount[] }>(
    "/api/tags?include_counts=true",
    fetcher,
  );

  return {
    tags: data?.tags ?? [],
    error,
    isLoading,
    mutate,
  };
}
