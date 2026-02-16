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
- Status: Not started
- Notes:
- PR/Commit:

### Milestone 2 — Backend DB helpers
- Status: Done
- Notes: Added D1 helper modules for tags, document notes (1 per doc), and highlights.
- PR/Commit:

### Milestone 3 — API routes (tags, document tags, notes, highlights)
- Status: In progress
- Notes: Tags API routes added (`/api/tags`, `/api/tags/[id]`), plus document tag assignment (`/api/documents/[id]/tags`), document note endpoints (`/api/documents/[id]/note`), highlight endpoints (`/api/documents/[id]/highlights`, `/api/highlights/[highlightId]`), notebook bundle endpoint (`/api/documents/[id]/notebook`), and list filter `?tag=<slug>`.
- PR/Commit:

### Milestone 4 — Shared types for Phase 2 payloads
- Status: In progress
- Notes: Added `Tag.slug` to shared type and updated schema reference.
- PR/Commit:

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

### Milestone 8 — In-text highlight rendering
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
