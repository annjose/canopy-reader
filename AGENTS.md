# Canopy Reader — Project Context

## What is this?

Canopy is a self-hosted read-it-later and knowledge management app (like Readwise Reader). Single-user, deployed on Cloudflare.

- **Spec**: `docs/canopy-spec.md` — full product specification
- **Repo structure**: `docs/repo-structure.md` — monorepo layout, tooling, migration workflow
- **Phase 1 plan**: `docs/plans/phase-1-foundation.md` — detailed implementation plan for MVP
- **Phase 1 progress**: `docs/plans/phase-1-progress.md` — current implementation status

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API routes on Cloudflare Workers (via `opennextjs-cloudflare`)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Auth**: Cloudflare Access (single user: ann.jose@gmail.com)
- **State management**: SWR
- **Types**: Shared via `@canopy/shared` package

## Workspace Packages

| Package | Path | Description |
|---------|------|-------------|
| `@canopy/web` | `apps/web` | Next.js app |
| `@canopy/shared` | `packages/shared` | Shared types & constants |

## Key Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
./scripts/migrate.sh --local   # Apply D1 migrations locally
./scripts/migrate.sh --remote  # Apply D1 migrations to production
```

## Cloudflare Account

- Account email: ann.jose@gmail.com
- Has access to two Cloudflare accounts: ann.jose@gmail.com and georgeck@gmail.com
- Canopy uses the ann.jose@gmail.com account
- Domain: `canopy.annjose.com`

## Database Migrations

- Migration files: `migrations/*.sql` (numbered, applied in order)
- Current: `0001_create_documents.sql` — documents table with indexes
- Full schema reference (not applied directly): `docs/schema.sql`

## Rules

- Use pnpm (not npm/yarn)
- Shared types go in `packages/shared`, not duplicated in `apps/web`
- Use `opennextjs-cloudflare` (not `@cloudflare/next-on-pages`) as the Cloudflare adapter
- Use SWR for client-side data fetching
- Database migrations go in `migrations/` as numbered SQL files
- Cloudflare account to use: ann.jose@gmail.com (not georgeck@gmail.com)
- **Do not create commits without explicit user approval.** You may stage changes and propose a commit message, but you must ask before running `git commit`.
- **Commit messages must briefly explain what changed and why.** Include a short subject line plus 2–5 bullet points in the body when useful.
- **Radix Dialog requirement:** any component built on Radix `Dialog` (including shadcn `Dialog`, `Sheet`, `CommandDialog`) must include a `DialogTitle` (can be `sr-only`) inside the content to avoid accessibility runtime errors.

### Phase planning & progress tracking
 - For each new phase (e.g. Phase 2, Phase 3), before implementing:
     - Create a detailed plan file in docs/plans/ named: phase-N-short-title.md
     - Create a progress tracking file in docs/plans/ named: phase-N-progress.md
     - Define clear milestones (and sub-tasks) in the plan file, and mirror those milestones as a checklist/table in the progress file.
     - Use docs/plans/phase-2-tags-highlight.md and docs/plans/phase-2-progress.md as the reference format.
 - During implementation:
     - Update phase-N-progress.md as work starts/finishes:
           - when starting a milestone: mark it In progress / Next
           - when finishing a milestone: mark it Done
     - Before proposing a commit message for a milestone, update the corresponding entry in phase-N-progress.md to reflect completion and briefly note what changed.
 - Keep progress tracking accurate:
     - Don’t mark milestones “Done” until the code is implemented, typechecks/builds, and the relevant UX path is verified.

## Conventions

- Types live in `packages/shared/src/types.ts`
- Constants live in `packages/shared/src/constants.ts`
- App code lives under `apps/web/src/`
- Path alias: `@/*` maps to `apps/web/src/*`
- All dates stored as ISO 8601 strings in D1
- IDs are nanoid-generated strings
