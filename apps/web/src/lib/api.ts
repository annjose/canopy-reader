import type { Document, DocumentStatus } from "@canopy/shared";

const BASE = "/api/documents";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function saveDocument(url: string) {
  return fetchJSON<Document>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function updateDocument(
  id: string,
  fields: Partial<
    Pick<
      Document,
      | "status"
      | "is_favorite"
      | "title"
      | "author"
      | "description"
      | "reading_progress"
      | "last_read_position"
    >
  >,
) {
  return fetchJSON<Document>(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}

export function deleteDocument(id: string) {
  return fetchJSON<{ success: boolean }>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}

export function restoreDocument(id: string) {
  return fetchJSON<{ success: boolean }>(`${BASE}/${id}/restore`, {
    method: "POST",
  });
}

export type ListDocumentsParams = {
  status?: DocumentStatus;
  type?: string;
  q?: string;
  sort?: "created_at" | "published_at" | "title";
  cursor?: string;
  limit?: number;
  is_trashed?: boolean;
  is_favorite?: boolean;
};

export type ListDocumentsResponse = {
  documents: Document[];
  nextCursor: string | null;
};

export function buildDocumentsUrl(params: ListDocumentsParams = {}): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.type) sp.set("type", params.type);
  if (params.q) sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.is_trashed) sp.set("is_trashed", "true");
  if (params.is_favorite) sp.set("is_favorite", "true");
  const qs = sp.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}
