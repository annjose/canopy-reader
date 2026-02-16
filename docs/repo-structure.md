# Canopy — Repository Structure

## Why a Monorepo?

Canopy uses a **pnpm workspaces + Turborepo** monorepo to share code between:
- `apps/web` — the main Next.js application (Phase 1+)
- `apps/extension` — Chrome browser extension (Phase 6)
- `apps/email-worker` — Cloudflare Email Worker (Phase 5)
- `packages/shared` — shared TypeScript types and constants

Shared types (Document, Tag, Highlight, etc.) live in `@canopy/shared` and are consumed by all apps, ensuring a single source of truth for the data model.

---

## Workspace Packages

| Package | Path | Description |
|---------|------|-------------|
| `@canopy/web` | `apps/web` | Next.js app deployed on Cloudflare Workers |
| `@canopy/shared` | `packages/shared` | Shared types, constants, and utilities |
| `@canopy/extension` | `apps/extension` | Chrome extension (Phase 6) |
| `@canopy/email-worker` | `apps/email-worker` | Email Worker (Phase 5) |

---

## Directory Layout

```
canopy-reader/
├── apps/
│   └── web/                        # Next.js app (main application)
│       ├── src/
│       │   ├── app/                # App Router pages & API routes
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── library/
│       │   │   ├── read/[id]/
│       │   │   └── api/documents/
│       │   ├── components/
│       │   │   ├── layout/         # app-shell, sidebar, right-panel
│       │   │   ├── documents/      # document-list, document-row, status-tabs, save-dialog
│       │   │   ├── reader/         # reader-view, toc, toolbar, progress-bar
│       │   │   ├── search/         # search-palette
│       │   │   └── keyboard/       # shortcut-provider, shortcuts-help
│       │   ├── lib/
│       │   │   ├── db.ts           # D1 query helpers
│       │   │   ├── r2.ts           # R2 storage helpers
│       │   │   ├── parser.ts       # Article content extraction
│       │   │   └── utils.ts        # nanoid, dates, etc.
│       │   └── hooks/
│       │       ├── use-keyboard-shortcuts.ts
│       │       ├── use-documents.ts
│       │       └── use-reading-progress.ts
│       ├── public/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── wrangler.toml           # D1 + R2 bindings
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared types & utilities
│       ├── src/
│       │   ├── types.ts            # Document, Tag, Highlight, Feed types
│       │   └── constants.ts        # Status values, type values, colors, etc.
│       ├── tsconfig.json
│       └── package.json
│
├── migrations/                     # D1 SQL migration files (numbered)
│   └── 0001_create_documents.sql
│
├── scripts/
│   ├── migrate.sh                  # Apply migrations via wrangler d1 execute
│   └── seed.ts                     # Seed dev database with sample data
│
├── docs/
│   ├── repo-structure.md           # This document
│   ├── schema.sql                  # Full schema reference (not applied directly)
│   └── plans/
│       └── phase-1-foundation.md
│
├── docs/canopy-spec.md
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                    # Root: workspace scripts, devDependencies
├── tsconfig.json                   # Root: shared TS settings
└── .gitignore
```

---

## Turborepo Pipeline

The `turbo.json` at the root defines the build pipeline:

| Task | Description | Dependencies |
|------|-------------|--------------|
| `build` | Compile each package/app | Depends on `^build` (builds dependencies first) |
| `dev` | Start dev servers | Persistent task, no caching |
| `lint` | Run ESLint | Independent |
| `typecheck` | Run `tsc --noEmit` | Depends on `^build` |

Run tasks from the root:
```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm typecheck    # Type-check all packages
```

---

## Migration Workflow

Database migrations live in `migrations/` as numbered SQL files.

### Creating a new migration

1. Create a new file: `migrations/NNNN_description.sql`
2. Use the next sequential number (e.g., `0002_create_tags.sql`)
3. Write idempotent SQL (use `CREATE TABLE IF NOT EXISTS` where appropriate)

### Applying migrations

Use the helper script:

```bash
# Apply all migrations to local D1
./scripts/migrate.sh --local

# Apply all migrations to production D1
./scripts/migrate.sh --remote
```

The script iterates over `migrations/*.sql` in order and applies each via `wrangler d1 execute`.

### Reference schema

`docs/schema.sql` contains the full schema across all phases for reference. It is **not** applied directly — use the migration files instead.

---

## Where Future Phases Add Code

| Phase | What's Added | Location |
|-------|-------------|----------|
| Phase 2: Tags & Highlights | New tables, API routes, UI components | `migrations/0002_*.sql`, `apps/web/src/` |
| Phase 3: RSS Feeds | Feed table, cron worker | `migrations/0003_*.sql`, `apps/web/src/` |
| Phase 4: File Uploads | EPUB/PDF reader components | `apps/web/src/` |
| Phase 5: Email | Cloudflare Email Worker | `apps/email-worker/` |
| Phase 6: Extension | Chrome Manifest V3 extension | `apps/extension/` |
| Phase 7: Obsidian | Export scripts/plugin | `apps/web/src/` or new package |

---

## Key Decisions

### State management: SWR
The app uses **SWR** for client-side data fetching. SWR is lightweight, Next.js-native (from Vercel), and well-suited for a read-heavy app with simple mutation patterns.

### Cloudflare adapter: opennextjs-cloudflare
We use **`opennextjs-cloudflare`** (not the older `@cloudflare/next-on-pages`) as the adapter for deploying Next.js on Cloudflare Workers. It is the newer, actively recommended approach with better App Router support.

### Testing strategy
Testing will be added in a dedicated pass after the core Phase 1 implementation. The approach will include:
- Unit tests for lib utilities (parser, db helpers) with Vitest
- API route integration tests against local D1
- Component tests for key UI interactions

### Error handling
Error handling patterns will be established during implementation:
- API routes return consistent JSON error responses with status codes
- Client-side: SWR error states with toast notifications for user-facing errors
- Content extraction failures are non-fatal (document saved with partial metadata)
