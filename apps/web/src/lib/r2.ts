export function contentKey(docId: string): string {
  return `articles/${docId}/content.html`;
}

export function thumbnailKey(docId: string): string {
  return `articles/${docId}/thumbnail.webp`;
}

export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  data: string | ArrayBuffer | ReadableStream,
): Promise<void> {
  await r2.put(key, data);
}

export async function getFromR2(
  r2: R2Bucket,
  key: string,
): Promise<string | null> {
  const obj = await r2.get(key);
  if (!obj) return null;
  return obj.text();
}

export async function deleteFromR2(
  r2: R2Bucket,
  key: string,
): Promise<void> {
  await r2.delete(key);
}
