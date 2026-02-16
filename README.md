# Canopy Reader

Canopy is a self-hosted read-it-later and knowledge management app inspired by Readwise Reader.

- **Deployment target:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Blob storage:** Cloudflare R2
- **Frontend/backend:** Next.js (App Router) running on Workers via `opennextjs-cloudflare`
- **Auth:** Cloudflare Access (single-user)

> Domain: `canopy.annjose.com`

## What you can do today (Phase 1 / MVP)

- Save an **article by URL**
- Server-side extraction using Mozilla Readability
- Store parsed article HTML in **R2**, metadata in **D1**
- Browse your library by status: **Inbox / Reading / Later / Archive**
- Reader view with a clean reading layout + table of contents
- Keyboard shortcuts (library + reader) and a `?` shortcuts help modal

## Monorepo structure

This is a pnpm workspaces + Turborepo monorepo.

- `apps/web` — main Next.js app (`@canopy/web`)
- `packages/shared` — shared TypeScript types/constants (`@canopy/shared`)
- `migrations/` — D1 migration files (numbered)
- `scripts/migrate.sh` — apply migrations (local or remote)
- `scripts/seed.ts` — seed local/dev data

For more detail, see `docs/repo-structure.md` and the Phase 1 plan/progress docs under `docs/plans/`.

## Requirements

- Node.js (repo currently uses Node 22 locally)
- pnpm
- Cloudflare Wrangler (`wrangler`) (already a dev dependency of `apps/web`)

## Install

```bash
pnpm install
```

## Local development

1) Apply D1 migrations to the **local** database:

```bash
./scripts/migrate.sh --local
```

2) (Optional) Seed the database:

```bash
pnpm -C apps/web tsx ../../scripts/seed.ts
# or run whatever seed script wrapper you use locally
```

3) Run the dev server:

```bash
pnpm dev
# or just the web app:
pnpm -C apps/web dev
```

Then open: http://localhost:3000

## Build

```bash
pnpm build
pnpm typecheck
```

(You can also run these per-app with `pnpm -C apps/web build`, etc.)

## Deploy (Cloudflare)

The web app deploys with OpenNext + Wrangler.

### One command deploy

From repo root:

```bash
pnpm deploy:web
```

Equivalent (running from the app directory):

```bash
pnpm -C apps/web run deploy
```

### Notes

- Deployment configuration and bindings live in: `apps/web/wrangler.toml`
- Make sure you are authenticated with Wrangler (`wrangler login`) and using the correct Cloudflare account.
- The Worker will be deployed to a `*.workers.dev` URL unless you configure a custom domain in Cloudflare.

## Database migrations

Migrations are numbered SQL files in `migrations/`.

```bash
# local
./scripts/migrate.sh --local

# production
./scripts/migrate.sh --remote
```

## Specs / docs

- Product spec: `docs/canopy-spec.md`
- Repo structure: `docs/repo-structure.md`
- Phase 1 plan: `docs/plans/phase-1-foundation.md`
- Phase 1 progress: `docs/plans/phase-1-progress.md`
