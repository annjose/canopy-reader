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
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 6 — UI: Tag picker + tag filter
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 7 — Highlights capture (save + list)
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 8 (Backlog) — In-text highlight rendering
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 9 — Tags management page
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 10 — Markdown export
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 11 — UI polish (reading progress, panels, font size, dark mode)
- Status: Not started
- Notes:
- PR/Commit:

---

## Decisions Log

See [`docs/decisions.md`](../decisions.md).
