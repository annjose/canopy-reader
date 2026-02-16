# Phase 1: Foundation & Core Reading (MVP)

**Goal**: Save articles by URL, read them in a clean reader view, organize with statuses, navigate with keyboard shortcuts. Establish the full deployment pipeline on Cloudflare.

**Spec reference**: [canopy-spec.md](../../canopy-spec.md) → Phase 1

---

## 1. Project Setup

### 1.1 Initialize Next.js App
- Create Next.js project with App Router
- Configure Tailwind CSS v4
- Set up TypeScript with strict mode
- Configure path aliases (`@/components`, `@/lib`, etc.)
- Add ESLint + Prettier

### 1.2 Cloudflare Deployment Pipeline
- Install and configure `wrangler` and `opennextjs-cloudflare` (or `@cloudflare/next-on-pages`)
- Create `wrangler.toml` with D1 binding and R2 binding
- Set up D1 database (dev + production)
- Set up R2 bucket (dev + production)
- Verify deployment: `wrangler deploy` → working hello-world page
- Set up custom domain: `canopy.annjose.com`

### 1.3 Cloudflare Access Auth
- Configure Cloudflare Access application for the domain
- Set policy: allow only `ann.jose@gmail.com`
- Verify: unauthenticated requests are redirected to Cloudflare login
- Read `Cf-Access-Jwt-Assertion` header in API routes to verify identity

### 1.4 Database Migrations
- Create migration system (simple numbered SQL files in `migrations/`)
- First migration: `documents` table (from `docs/schema.sql`, Phase 1 section only)
- Script to apply migrations via `wrangler d1 execute`
- Seed script with sample data for development

### 1.5 R2 Storage Utilities
- Helper functions: `uploadToR2(key, data)`, `getFromR2(key)`, `deleteFromR2(key)`
- Content key pattern: `articles/{document_id}/content.html`
- Thumbnail key pattern: `articles/{document_id}/thumbnail.webp`

---

## 2. API Layer

### 2.1 Document CRUD API Routes
All routes under `/api/documents`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents` | Create document (save by URL) |
| `GET` | `/api/documents` | List documents (with filters: status, type, search, sort, pagination) |
| `GET` | `/api/documents/[id]` | Get single document with metadata |
| `PATCH` | `/api/documents/[id]` | Update document (status, favorite, metadata) |
| `DELETE` | `/api/documents/[id]` | Soft delete (set is_trashed = 1) |
| `POST` | `/api/documents/[id]/restore` | Restore from trash |
| `GET` | `/api/documents/[id]/content` | Get parsed HTML content from R2 |

### 2.2 Article Content Extraction
When `POST /api/documents` receives a URL:
1. Fetch the page HTML (server-side)
2. Parse with Mozilla Readability (via `@mozilla/readability` + `linkedom` or `jsdom`)
3. Extract: title, author, excerpt, content HTML, word count, reading time, published date, language
4. Extract domain from URL
5. Fetch and store thumbnail image (og:image) → R2
6. Store parsed HTML → R2
7. Store metadata → D1
8. Return created document

### 2.3 Search
- `GET /api/documents?q=search+term` — search across title, author, description, domain
- D1 `LIKE` queries for Phase 1 (can upgrade to FTS later)

---

## 3. UI Components

### 3.1 Layout Shell
Three-panel responsive layout matching Readwise screenshots.

```
Desktop (≥1024px):  [Sidebar 240px] [Main flexible] [Right Panel 320px]
Tablet (768-1023):  [Sidebar overlay] [Main flexible] [Right Panel overlay]
Mobile (<768px):    [Full-width single column, hamburger for sidebar]
```

**Components**:
- `AppShell` — top-level layout with sidebar + main + right panel
- `Sidebar` — navigation links, collapsible on mobile
- `RightPanel` — metadata panel, collapsible

### 3.2 Sidebar
Match the Readwise sidebar structure:

```
Home
Library ─────────────
  Articles
  Books
  Emails
  PDFs
Feeds ───────────────
  Manage feeds
Tags
─────────────────────
Favorites
Trash
─────────────────────
Search
Preferences
```

- Active state highlighting
- Counts (number of items per category)
- Collapsible sections (Library, Feeds)
- Mobile: slide-out drawer with overlay

### 3.3 Document List View
- **Status tabs**: INBOX | READING | LATER | ARCHIVE (horizontal tabs above list)
- **Sort dropdown**: Date saved (default), Date published, Title
- **Document row**: thumbnail (left), title + description + meta line (center), saved date (right)
  - Meta line: source favicon + domain + reading time
  - Hover: show action buttons (archive, favorite, delete)
  - Selected state: subtle highlight background
- **Empty state**: friendly message per status
- **Infinite scroll** or pagination (cursor-based)
- Keyboard-navigable: `j/k` moves selection, `Enter` opens

### 3.4 Reader View
Activated when a document is opened. Replaces the list view in the main panel.

- **Top toolbar**: ← back, ↑↓ prev/next doc, Aa font size, copy link, open original, archive, trash, ··· more
- **Table of contents** (left sub-panel, collapsible):
  - Extracted from `<h1>`–`<h3>` headings in parsed HTML
  - Click to scroll to section
  - Active section highlighted on scroll
- **Content area**: rendered parsed HTML with clean typography
  - Max-width ~680px centered
  - Responsive font sizes
  - Code block styling
  - Image handling (lazy load, max-width)
- **Reading progress**: thin progress bar at top of reader
- **Scroll position tracking**: save `scrollTop` percentage on scroll (debounced), write to `reading_progress` on unmount or periodically

### 3.5 Right Panel — Info Tab
Displayed when a document is selected in list view or open in reader.

- Document title
- Domain + favicon
- **Metadata table**:
  - Type (Article, Book, etc.)
  - Domain
  - Author
  - Published date
  - Length (word count + reading time)
  - Saved date
  - Progress (percentage + time remaining)
  - Language
- "Edit metadata" button (opens inline edit form)

### 3.6 Save Article Dialog
- Triggered from sidebar "+" button or keyboard shortcut
- Simple modal: URL input field + Save button
- Shows loading state while fetching + parsing
- On success: navigates to the new document in reader

---

## 4. Keyboard Shortcuts

### 4.1 Shortcut Engine
- Global keyboard listener (attach to `window`)
- Ignore when focused on input/textarea/contentEditable
- Support single keys (`j`, `k`) and chord sequences (`g i`, `g a`)
- Chord timeout: 1 second between keys
- Display shortcut hints on hover (tooltips)

### 4.2 List View Shortcuts
| Key | Action |
|-----|--------|
| `j` | Select next document |
| `k` | Select previous document |
| `Enter` / `o` | Open selected document in reader |
| `i` | Move selected to Inbox |
| `r` | Move selected to Reading |
| `l` | Move selected to Later |
| `e` | Move selected to Archive |
| `s` | Toggle favorite |
| `#` | Move to Trash |
| `/` | Focus search input |
| `?` | Show shortcuts help modal |
| `g h` | Navigate to Home |
| `g i` | Navigate to Inbox |
| `g r` | Navigate to Reading |
| `g l` | Navigate to Later |
| `g a` | Navigate to Archive |
| `g f` | Navigate to Feeds |

### 4.3 Reader View Shortcuts
| Key | Action |
|-----|--------|
| `j` / `↓` | Scroll down |
| `k` / `↑` | Scroll up |
| `Escape` / `u` | Back to list |
| `[` | Previous document |
| `]` | Next document |
| `c` | Toggle table of contents |
| `p` | Toggle right panel |
| `v` | Open original URL in new tab |
| `e` | Archive current document |
| `s` | Toggle favorite |
| `?` | Show shortcuts help |

### 4.4 Shortcuts Help Modal
- Overlay triggered by `?`
- Grouped by context: Navigation, Actions, Reader
- Dismiss with `Escape` or click outside

---

## 5. Search

### 5.1 Search UI
- Search icon in sidebar → click or `/` shortcut opens search
- Command palette style overlay (like Cmd+K)
- Real-time search as you type (debounced 300ms)
- Results: document list matching query
- Click result → open in reader
- Filter chips: by type, by status

### 5.2 Search API
- `GET /api/documents?q=term&status=inbox&type=article`
- Searches: title, author, description, domain
- Case-insensitive `LIKE '%term%'` on D1
- Ordered by relevance (title match first, then description)

---

## 6. Mobile Responsive

### 6.1 Breakpoints
- `< 768px` — mobile: single column, hamburger sidebar, no right panel by default
- `768px – 1023px` — tablet: main + collapsible sidebar/right panel overlays
- `≥ 1024px` — desktop: full three-panel layout

### 6.2 Mobile-Specific Behavior
- Sidebar: hamburger icon in top-left → slide-out drawer with backdrop
- Right panel: accessed via "Info" button in toolbar → slides in from right or bottom sheet
- List view: full-width cards, larger touch targets
- Reader view: full-width content, floating toolbar that hides on scroll down / shows on scroll up
- Status tabs: horizontally scrollable if overflow

---

## 7. Development & Deployment

### 7.1 Local Development
- `npm run dev` — Next.js dev server with hot reload
- Local D1 with `wrangler d1 execute --local` for migrations
- Local R2 with miniflare (bundled in wrangler)
- Seed script: `npm run seed` — populates DB with sample articles

### 7.2 Deployment
- `npm run deploy` — builds + deploys via wrangler
- Production D1 database
- Production R2 bucket
- Cloudflare Access protects the domain

### 7.3 Project Structure
```
canopy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with AppShell
│   │   ├── page.tsx            # Home / redirect to inbox
│   │   ├── library/
│   │   │   └── page.tsx        # Document list view
│   │   ├── read/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Reader view
│   │   └── api/
│   │       └── documents/
│   │           ├── route.ts    # GET (list), POST (create)
│   │           └── [id]/
│   │               ├── route.ts    # GET, PATCH, DELETE
│   │               ├── content/
│   │               │   └── route.ts  # GET content HTML
│   │               └── restore/
│   │                   └── route.ts  # POST restore from trash
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── right-panel.tsx
│   │   ├── documents/
│   │   │   ├── document-list.tsx
│   │   │   ├── document-row.tsx
│   │   │   ├── status-tabs.tsx
│   │   │   └── save-dialog.tsx
│   │   ├── reader/
│   │   │   ├── reader-view.tsx
│   │   │   ├── table-of-contents.tsx
│   │   │   ├── reader-toolbar.tsx
│   │   │   └── progress-bar.tsx
│   │   ├── search/
│   │   │   └── search-palette.tsx
│   │   └── keyboard/
│   │       ├── shortcut-provider.tsx
│   │       └── shortcuts-help.tsx
│   ├── lib/
│   │   ├── db.ts               # D1 query helpers
│   │   ├── r2.ts               # R2 storage helpers
│   │   ├── parser.ts           # Article content extraction (Readability)
│   │   ├── utils.ts            # Shared utilities (nanoid, dates, etc.)
│   │   └── types.ts            # TypeScript types for Document, etc.
│   └── hooks/
│       ├── use-keyboard-shortcuts.ts
│       ├── use-documents.ts    # SWR/React Query hook for document list
│       └── use-reading-progress.ts
├── migrations/
│   └── 0001_create_documents.sql
├── public/
├── docs/
│   ├── schema.sql
│   └── plans/
│       └── phase-1-foundation.md
├── wrangler.toml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── canopy-spec.md
```

---

## Deliverables Checklist

- [ ] Next.js + Tailwind CSS v4 project initialized
- [ ] Wrangler config with D1 + R2 bindings
- [ ] Cloudflare Access protecting the domain
- [ ] D1 migration: `documents` table created
- [ ] API: POST /api/documents (save URL → parse → store)
- [ ] API: GET /api/documents (list with filters)
- [ ] API: GET /api/documents/[id] (single document)
- [ ] API: PATCH /api/documents/[id] (update status, favorite)
- [ ] API: DELETE /api/documents/[id] (soft delete)
- [ ] API: GET /api/documents/[id]/content (R2 content)
- [ ] Three-panel layout shell (responsive)
- [ ] Sidebar navigation
- [ ] Document list with status tabs
- [ ] Document row component with metadata
- [ ] Reader view with parsed content
- [ ] Table of contents in reader
- [ ] Reading progress tracking
- [ ] Font size adjustment
- [ ] Open original URL
- [ ] Prev/next document navigation
- [ ] Right panel with Info tab (metadata)
- [ ] Save article dialog (URL input)
- [ ] Keyboard shortcuts (all list + reader shortcuts)
- [ ] Shortcuts help modal
- [ ] Search (command palette + API)
- [ ] Mobile responsive layout
- [ ] Deploy to Cloudflare Workers
- [ ] Seed data for development
