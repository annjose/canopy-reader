# Canopy — Decisions Log

This file collects product/tech decisions that affect implementation across phases.

Keep entries short and dated.

---

## 2026-02-16 — Phase 2: Tags, Notes & Highlights

- **Document notes**: one note per document (enforce uniqueness by `document_id`).
- **Tags**:
  - Store tag **display name** as entered (spaces/case allowed).
  - Store a derived **slug** (kebab-case) for URLs and uniqueness.
  - Canonical library filter uses `?tag=<slug>`.
- **Highlights**:
  - Store offsets + quote text in `position_data` JSON.
  - In-text highlight rendering is deferred to a Phase 2 backlog milestone.
