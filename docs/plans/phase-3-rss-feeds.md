# Phase 3 — RSS Feeds: Plan & Progress

**Goal**: Subscribe to RSS/Atom feeds and read feed items within Canopy, using the same document model, status workflow, and reader experience as articles.

- Spec reference: `docs/canopy-spec.md` — Phase 3
- Overall status: **In progress**

**Rule**: Implement milestone-by-milestone, test, then commit after each block.

---

## Status Legend
- Not started
- In progress
- Done

---

## Milestones

### Milestone 1 — Database: Feeds table (migration 0003)
- Status: Done
- Work: Create `migrations/0003_feeds.sql` matching the schema in `docs/schema.sql`
- Files: `migrations/0003_feeds.sql`
- Test: `pnpm -r typecheck`
- PR/Commit:

### Milestone 2 — Feed parser + auto-discovery modules
- Status: Done
- Work: Install `fast-xml-parser`, create `feed-parser.ts` (RSS 2.0 + Atom normalization), create `feed-discovery.ts` (HTML `<link rel="alternate">` auto-discovery)
- Files: `apps/web/package.json`, `apps/web/src/lib/feed-parser.ts`, `apps/web/src/lib/feed-discovery.ts`
- Test: `pnpm -r typecheck`
- PR/Commit:

### Milestone 3 — Backend: Feed DB helpers
- Status: Not started
- Work: Create `feeds-db.ts` with CRUD helpers. Extend `ListDocumentsFilters` with `feed_id` and `folder` filters.
- Files: `apps/web/src/lib/feeds-db.ts`, `apps/web/src/lib/db.ts`
- Test: `pnpm -r typecheck`
- PR/Commit:

### Milestone 4 — API routes: Feed CRUD
- Status: Not started
- Work: `GET/POST /api/feeds`, `GET/PATCH/DELETE /api/feeds/[id]`, `GET /api/feeds/folders`. POST subscribe uses auto-discovery + dedup.
- Files: `apps/web/src/app/api/feeds/route.ts`, `apps/web/src/app/api/feeds/[id]/route.ts`, `apps/web/src/app/api/feeds/folders/route.ts`
- Test: `pnpm -r typecheck`, smoke test via devtools
- PR/Commit:

### Milestone 5 — Feed polling logic + poll API routes
- Status: Not started
- Work: Create `feed-poller.ts` (fetch, dedup, Readability with RSS content fallback, upload to R2, insert documents). API routes: `POST /api/feeds/poll`, `POST /api/feeds/[id]/poll`.
- Files: `apps/web/src/lib/feed-poller.ts`, `apps/web/src/app/api/feeds/poll/route.ts`, `apps/web/src/app/api/feeds/[id]/poll/route.ts`
- Test: Subscribe, poll, verify documents + content in R2, poll again to verify dedup
- PR/Commit:

### Milestone 6 — Shared types + Client API + SWR hooks
- Status: Not started
- Work: Add `FeedWithCount` to shared types. Add feed client API functions. Extend `ListDocumentsParams` with `feed_id`/`folder`. Create `use-feeds.ts` SWR hooks.
- Files: `packages/shared/src/types.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/hooks/use-feeds.ts`
- Test: `pnpm -r typecheck`
- PR/Commit:

### Milestone 7 — UI: Feeds page + sidebar entry
- Status: Not started
- Work: Add "Feeds" to sidebar `NAV_ITEMS`. Create `/feeds` page with feed list, add-feed dialog, feed items view. Add `g f` keyboard shortcut.
- Files: `apps/web/src/components/layout/sidebar.tsx`, `apps/web/src/app/feeds/page.tsx`, `apps/web/src/components/feeds/feed-list.tsx`, `apps/web/src/components/feeds/feed-row.tsx`, `apps/web/src/components/feeds/add-feed-dialog.tsx`, `apps/web/src/components/feeds/feed-items.tsx`
- Test: `pnpm -r typecheck`, `pnpm dev` smoke test
- PR/Commit:

### Milestone 8 — Feed editing, folders, error states, bulk actions
- Status: Not started
- Work: Edit dialog (rename, folder, active toggle, delete). Folder grouping in feed list. Error badges + retry. Mark-all-read API route + button.
- Files: `apps/web/src/components/feeds/edit-feed-dialog.tsx`, `apps/web/src/app/api/feeds/[id]/mark-read/route.ts`, `apps/web/src/lib/feeds-db.ts`, `apps/web/src/components/feeds/feed-list.tsx`, `apps/web/src/components/feeds/feed-row.tsx`
- Test: `pnpm -r typecheck`, `pnpm dev` smoke test
- PR/Commit:

### Milestone 9 — Polish: feed context in document rows, OPML import
- Status: Not started
- Work: Show feed name on `rss_item` documents (LEFT JOIN feeds). OPML import endpoint. Optional `feed_title` on Document. Wrangler.toml cron comment.
- Files: `apps/web/src/lib/db.ts`, `packages/shared/src/types.ts`, `apps/web/src/components/documents/document-row.tsx`, `apps/web/src/app/api/feeds/import/route.ts`, `apps/web/wrangler.toml`
- Test: `pnpm build` (full production build)
- PR/Commit:

---

## Key Decisions

1. **RSS/Atom parsing**: `fast-xml-parser` — zero-dependency, Cloudflare Workers compatible
2. **Auto-discovery**: Parse HTML for `<link rel="alternate" type="application/rss+xml">` using existing `linkedom`
3. **Feed item content**: Try `parseArticle(item.url)` for full Readability content; fallback to RSS `content:encoded` / `description`
4. **Cron**: Build as `POST /api/feeds/poll` API route first; separate Cloudflare Cron Trigger worker can be added later
5. **Feeds view**: Dedicated `/feeds` page with sidebar entry; reuses `DocumentRow` for feed items
6. **Deduplication**: `SELECT id FROM documents WHERE url = ? AND feed_id = ?` before inserting

---

## New Files Summary

| File | Purpose |
|------|---------|
| `migrations/0003_feeds.sql` | Feeds table migration |
| `apps/web/src/lib/feed-parser.ts` | RSS/Atom XML parsing |
| `apps/web/src/lib/feed-discovery.ts` | Auto-discover feed URL from page |
| `apps/web/src/lib/feeds-db.ts` | D1 helpers for feeds CRUD |
| `apps/web/src/lib/feed-poller.ts` | Polling logic (fetch + parse + create docs) |
| `apps/web/src/hooks/use-feeds.ts` | SWR hooks for feeds |
| `apps/web/src/app/api/feeds/route.ts` | GET (list) + POST (subscribe) |
| `apps/web/src/app/api/feeds/[id]/route.ts` | GET + PATCH + DELETE |
| `apps/web/src/app/api/feeds/folders/route.ts` | GET folders |
| `apps/web/src/app/api/feeds/poll/route.ts` | POST (poll all) |
| `apps/web/src/app/api/feeds/[id]/poll/route.ts` | POST (poll single) |
| `apps/web/src/app/api/feeds/[id]/mark-read/route.ts` | POST (bulk archive) |
| `apps/web/src/app/api/feeds/import/route.ts` | POST (OPML import) |
| `apps/web/src/app/feeds/page.tsx` | Feeds page |
| `apps/web/src/components/feeds/feed-list.tsx` | Feed subscription list |
| `apps/web/src/components/feeds/feed-row.tsx` | Single feed row |
| `apps/web/src/components/feeds/feed-items.tsx` | Feed items (document list) |
| `apps/web/src/components/feeds/add-feed-dialog.tsx` | Subscribe dialog |
| `apps/web/src/components/feeds/edit-feed-dialog.tsx` | Edit/delete dialog |
