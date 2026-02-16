/**
 * Converts a display name (spaces/case allowed) into a kebab-case slug.
 * Used for tag URL filtering and uniqueness.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}
