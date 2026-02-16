# Phase 2: Tags, Notes & Highlights

**Goal**: Add a full annotation + organization system on top of Phase 1 (documents + reader), including tags, document notes, and text highlights.

- Spec reference: [`docs/canopy-spec.md`](../canopy-spec.md) → Phase 2
- Repo structure: [`docs/repo-structure.md`](../repo-structure.md)
- Phase 2 progress tracker: [`docs/plans/phase-2-progress.md`](phase-2-progress.md)

This plan is designed to be implemented **milestone-by-milestone**, with **testing + a commit after each block of work**.

---

## Constraints / Guardrails

- **Migrations**: Add new numbered SQL migrations under `migrations/` (do not edit old migrations). Apply with `./scripts/migrate.sh --local` then `--remote`.
- **Shared types**: Single source of truth in `packages/shared` (no duplicated model types in `apps/web`).
- **Client data fetching**: Use SWR (`useSWR`) + existing patterns (`useDocuments`, `useDocument`).
- **Auth**: All API routes must enforce Cloudflare Access via `requireAccess()`.
- **Radix Dialog a11y**: Any component using Radix `Dialog` (including shadcn `Dialog`, `Sheet`, `CommandDialog`) must include a `DialogTitle` (can be `sr-only`) inside the content.
- **Do not commit without explicit approval** (we will stage changes and propose a commit message).

---

## Decisions (locked in)

See [`docs/decisions.md`](../decisions.md) for the running log.

1. **Document notes**: **one note per document**.
   - Enforce with a unique index on `document_notes(document_id)`.
2. **Tags**: allow spaces/case for the display name.
   - Store `tags.name` as the user-entered display name.
   - Store `tags.slug` as a normalized kebab-case slug used in URLs and for uniqueness.
   - Canonical filter URL: `/library?tag=<slug>`.

---

## Milestone 1 — Database: Phase 2 tables (migration 0002)

### Work
- Add migration: `migrations/0002_tags_notes_highlights.sql`
  - `tags` (includes `name` + `slug`)
  - `document_tags`
  - `highlights`
  - `document_notes`
- Add indexes:
  - `document_tags(tag_id)` (already in schema reference)
  - `document_tags(document_id)` (recommended)
  - `highlights(document_id)` (already in schema reference)
  - Optional: `highlights(document_id, created_at)`
- Decide `document_notes` uniqueness:
  - Recommended: `UNIQUE(document_id)` via a unique index.

### Acceptance criteria
- Local migration applies cleanly (`./scripts/migrate.sh --local`).
- `wrangler d1 execute ... --local` queries show tables exist.

### Test checklist
- Apply migrations locally.
- Run `pnpm -r typecheck`.

### Commit
- Stage migration only.

---

## Milestone 2 — Backend DB helpers for Phase 2

### Work
Add D1 helper functions in `apps/web/src/lib/` (either in `db.ts` or separate modules):

#### Tags
- `listTags(db)`
- `createTag(db, { name, color? })`
- `updateTag(db, id, { name?, color? })`
- `deleteTag(db, id)`
- `getTagsForDocument(db, documentId)`
- `replaceDocumentTags(db, documentId, tagIds[])`

#### Document note
- `getDocumentNote(db, documentId)`
- `upsertDocumentNote(db, documentId, content)`

#### Highlights
- `listHighlights(db, documentId)`
- `createHighlight(db, documentId, { text, note?, color, position_data? })`
- `updateHighlight(db, highlightId, { note?, color? })`
- `deleteHighlight(db, highlightId)`

### Acceptance criteria
- Helper functions compile and are used by API routes in later milestones.
- No changes to Phase 1 behavior.

### Test checklist
- `pnpm -r typecheck`

### Commit
- Stage code changes only.

---

## Milestone 3 — API routes: Tags, Notes, Highlights

### Work
Create API routes under `apps/web/src/app/api/`.

#### Tags
- `GET /api/tags` — list tags (optionally include `document_count`)
- `POST /api/tags` — create tag
- `PATCH /api/tags/[id]` — rename/recolor
- `DELETE /api/tags/[id]` — delete

#### Document ↔ Tags
- `GET /api/documents/[id]/tags`
- `PUT /api/documents/[id]/tags` — replace tags for document

#### Document note
- `GET /api/documents/[id]/note`
- `PUT /api/documents/[id]/note`

#### Highlights
- `GET /api/documents/[id]/highlights`
- `POST /api/documents/[id]/highlights`
- `PATCH /api/highlights/[highlightId]`
- `DELETE /api/highlights/[highlightId]`

#### Optional (recommended)
- `GET /api/documents/[id]/notebook` → `{ tags, note, highlights }`

### Acceptance criteria
- All routes:
  - enforce Access via `requireAccess()`
  - return consistent JSON errors `{ error: string }`
  - validate inputs (400 on bad request)
- Manual smoke test via browser devtools `fetch()` works locally.

### Test checklist
- `pnpm dev` + exercise endpoints.
- `pnpm -r typecheck`

### Commit
- Stage API routes + related helpers.

---

## Milestone 4 — Shared types: Phase 2 payloads

### Work
- Keep existing `Tag`, `Highlight`, `DocumentNote` types.
- Add any additional shared types needed for API responses, e.g.:
  - `NotebookData` for combined notebook endpoint

### Acceptance criteria
- No type duplication in `apps/web`.
- `pnpm -r typecheck` passes.

### Commit
- Stage changes in `packages/shared` (and any consumers).

---

## Milestone 5 — UI: Right Panel “Info | Notebook”

### Work
Update `apps/web/src/components/layout/right-panel.tsx`:

- Add tabs:
  - Info (existing details)
  - Notebook
- Notebook tab sections:
  1. **Tags**: chip list + edit button
  2. **Document note**: textarea (markdown)
  3. **Highlights list**: display saved highlights; allow editing note + deleting highlight

Add SWR hooks in `apps/web/src/hooks/`:
- `useTags()`
- `useDocumentTags(documentId)`
- `useDocumentNote(documentId)`
- `useHighlights(documentId)`
- OR `useNotebook(documentId)` if using combined endpoint

### Acceptance criteria
- Desktop: right panel shows Notebook tab when a document is selected/open.
- Mobile: right panel sheet still works and contains Notebook.

### Test checklist
- Open a document and verify Notebook data fetch and renders.
- Confirm Radix dialog/sheet a11y requirements still satisfied.

### Commit
- Stage UI + hooks.

---

## Milestone 6 — UI: Tag picker dialog + tag filter

### Work
#### Tag picker dialog
- Build a dialog (likely `Dialog` + `Command`) to:
  - search existing tags
  - create new tag when none matches
  - multi-select
  - apply via `PUT /api/documents/[id]/tags`

#### Library filtering
- Extend `/library` document list filtering to support `tag=<slug>`.
- Add an entry point for tag filtering:
  - Either a Tags section in sidebar (Phase 2), or within Notebook.

### Acceptance criteria
- Tag picker allows add/remove tags on a document.
- Library view can filter by a tag.

### Commit
- Stage tag picker + filters.

---

## Milestone 7 — Highlights capture (save + list)

### Work
In reader view (`ReaderView` or wrapper):
- Detect text selection within `.article-content`.
- Show highlight popover near selection:
  - choose color
  - optionally attach a note
- On choose → `POST /api/documents/[id]/highlights`

**Position data** (initial plan):
- Store `position_data` JSON containing at least:
  - selection offsets in the article text
  - selected quote text

### Acceptance criteria
- User can select text in reader and create a highlight.
- Highlight appears in Notebook list.

### Commit
- Stage reader selection UI + highlight creation.

---

## Milestone 8 — In-text highlight rendering (higher risk)

### Work
- Fetch highlights for the document.
- Post-process the article DOM to wrap highlighted ranges in `<mark>`/`<span>`.
- Keep this isolated so Phase 2 core remains stable even if DOM anchoring needs iteration.

### Acceptance criteria
- Highlights render in the article without breaking layout.
- Edits/deletes update rendering.

### Commit
- Stage rendering logic separately (keep isolated).

---

## Milestone 9 — Tags management page (rename/merge/delete)

### Work
- Add sidebar entry: `Tags`
- Add page: `/tags`
  - list tags + counts
  - rename
  - delete
  - merge tags

### Acceptance criteria
- Tag CRUD works end-to-end.
- Merge moves document associations.

### Commit
- Stage tags page + API merge route if needed.

---

## Milestone 10 — Markdown export

### Work
- API:
  - `GET /api/documents/[id]/export` → markdown
- UI:
  - “Export” button in Notebook tab

Template should match spec (frontmatter + notes + highlights).

### Acceptance criteria
- Export produces correct markdown with tags and highlights.

### Commit
- Stage export work.

---

## Milestone 11 — UI polish (includes Dark Mode)

This milestone explicitly covers the **UI polish** items listed under Phase 2 in `docs/canopy-spec.md`:

1. **Persist reading progress to D1**
   - Implement a debounced writer from reader scroll/progress → `PATCH /api/documents/[id]` (`reading_progress`, `last_read_position`).
   - Ensure we don’t spam writes (e.g. debounce 1–3s and also write on unmount).

2. **Close left / right panels like Readwise**
   - Add bindings for `[` and `]` to toggle sidebar collapse and right panel.
   - Ensure behavior differs appropriately between desktop vs mobile sheets.

3. **Font size adjustment in reader**
   - Add UI control in the reader toolbar.
   - Store preference locally (e.g. `localStorage`) and apply via a CSS variable on `.article-content`.

4. **Dark mode**
   - Add `:root` + `.dark` token overrides in `apps/web/src/app/globals.css`.
   - Add a theme toggle (likely in sidebar or a simple Preferences page later).
   - Persist theme preference (localStorage) and apply by toggling the `dark` class on `document.documentElement`.
   - Update hard-coded article typography colors (currently fixed grays/blues) to use tokens or add `.dark` overrides.

### Acceptance criteria
- Reader progress persists and reloads without regressions.
- `[`/`]` panel shortcuts work on desktop and don’t break mobile.
- Font size setting persists across reload.
- Dark mode works across app shell + reader content with acceptable contrast.

### Commit
- Stage UI polish work.

---

## Testing & Release Process (per milestone)

For each milestone:
1. `pnpm -r typecheck`
2. `pnpm dev` smoke test relevant flows
3. Stage changes
4. Propose commit message
5. Wait for explicit approval before `git commit`
