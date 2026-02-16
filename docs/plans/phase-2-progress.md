# Phase 2 — Progress: Tags, Notes & Highlights

This doc tracks implementation progress for Phase 2 against the plan:
- Plan: [`phase-2-tags-highlight.md`](phase-2-tags-highlight.md)

**Rule**: We implement milestone-by-milestone, test, then commit after each block.

---

## Status Legend
- Not started
- In progress
- Blocked
- Done

---

## Milestones

### Milestone 1 — DB migration 0002 (tags/notes/highlights)
- Status: Done
- Notes: Added `tags`, `document_tags`, `highlights`, `document_notes` tables. Tags include display `name` + URL `slug`. Enforced one note per document via unique index.
- PR/Commit: 6f3f477

### Milestone 2 — Backend DB helpers
- Status: Done
- Notes: Added D1 helper modules for tags, document notes (1 per doc), and highlights.
- PR/Commit: bf7802d

### Milestone 3 — API routes (tags, document tags, notes, highlights)
- Status: Done
- Notes: Implemented tags CRUD (`/api/tags`, `/api/tags/[id]`), document tag assignment (`/api/documents/[id]/tags`), tag filter (`/api/documents?tag=<slug>`), document notes (`/api/documents/[id]/note`), highlights (`/api/documents/[id]/highlights`, `/api/highlights/[highlightId]`), and notebook bundle (`/api/documents/[id]/notebook`).
- PR/Commit: 477ea2c, f66db25, bce90d0, 4d359f6, 3a7acec

### Milestone 4 — Shared types for Phase 2 payloads
- Status: Done
- Notes: Updated shared `Tag` type with `slug` and added `NotebookData` for the notebook bundle payload.
- PR/Commit: bf7802d, 3a7acec

### Milestone 5 — UI: Right Panel Notebook tab
- Status: Done
- Notes: Notebook tab in right panel implemented with document note editor + highlight note editing + delete. Tag editing/picker comes in Milestone 6.
- PR/Commit:

### Milestone 6 — UI: Tag picker + tag filter
- Status: Done
- Notes: Library supports `?tag=<slug>` filtering (now intersects with status tabs) and Notebook tag picker dialog added (create/select + apply to document).
- PR/Commit: 

### Milestone 7 — Highlights capture (save + list)
- Status: Done
- Notes: Reader text-selection popover implemented to create highlights (default yellow) with optional note + color picker; syncs to Notebook; selection trigger made more reliable by listening on document mouseup.
- PR/Commit: a386523

### Milestone 8 — In-text highlight rendering
- Status: Done
- Notes: Rendering saved highlights inline in reader via span wrappers (best-effort quote matching).  Overhauled highlight UX with compact toolbar and inline editing using Claude Code with Opus.
- PR/Commit: ea59c7f

### Milestone 9 — Tags management page
- Status: Done
- Notes: Added `/tags` page with tag counts, create, rename, delete, and merge actions. Added `Tags` sidebar entry. Extended tags API with optional counts (`GET /api/tags?include_counts=true`) and merge endpoint (`POST /api/tags/merge`). Also surfaced document tags in library rows (next to domain/reading time), fixed immediate list refresh after tag updates from Notebook, and added keyboard shortcut `t` (Library + Reader) to open the tag editor for the current document.
- PR/Commit:

### Milestone 10 — Markdown export
- Status: Done
- Notes: Added `GET /api/documents/[id]/export` to generate markdown with frontmatter + document note + highlights (including highlight notes). Added `Export markdown` action in Notebook tab that downloads the generated `.md` file.
- PR/Commit:

### Milestone 11 — UI polish (reading progress, panels, font size, dark mode)
- Status: In progress
- Notes: 
 - 11.1 done (reader restores last known position and writes debounced `reading_progress` + `last_read_position` updates to D1 with flush on leave). 
 - 11.2 done (global panel shortcuts `[`/`]`, `Ctrl/⌘ + /` for shortcuts help, and `n` to open Save URL dialog; fixed `]` key detection using bracket key codes).
 - 11.3 done (reader font size controls in toolbar with A-/A+/reset, applied via CSS variable, persisted in localStorage with min/max clamp).
- PR/Commit:

---

## Decisions Log

See [`docs/decisions.md`](../decisions.md).
