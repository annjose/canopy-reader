# Canopy — Product Specification

## Overview

**Canopy** — a self-hosted read-it-later and knowledge management app inspired by Readwise Reader. A place where all your documents come together under one roof. Built with Next.js, React, and Tailwind CSS v4, deployed on Cloudflare Workers with D1 (database) and R2 (file storage). Single-user app authenticated via Cloudflare Access.

Domain: `canopy.annjose.com`

---

## Core Concepts

### Content Types
All content is stored as **Documents**. Each document has a `type`:
- **Article** — web page saved via URL or browser extension
- **Book** — uploaded EPUB file
- **PDF** — uploaded PDF file
- **Email/Newsletter** — received via Cloudflare Email Routing
- **RSS Item** — fetched from subscribed RSS feeds

### Unified Library with Feeds Filter
All documents live in a single library. The sidebar provides two primary views:
- **Library** — all manually saved content (articles, books, PDFs, newsletters)
- **Feeds** — RSS feed items only

Both views share the same status model and UI patterns. This avoids the Readwise confusion of separate Library/Feed status systems.

### Document Statuses
Every document has one status:
- **Inbox** — newly saved, unprocessed (default for all new content)
- **Reading** — actively reading / in progress
- **Later** — triaged, saved for future reading
- **Archive** — finished or processed

Additionally:
- **Favorites** — a boolean flag (star/pin) that works across all statuses, for quick access to best content
- **Trash** — soft delete, recoverable for 30 days

### Tags
- Flat tag system (no hierarchy)
- Documents can have multiple tags
- Tags are user-created, with autocomplete
- Tags are filterable in the sidebar and searchable
- Tag management page for renaming, merging, deleting tags

### Notes & Highlights
- **Highlights** — text selections saved from the reader view, with optional color coding (yellow, blue, green, red, purple)
- **Notes** — freeform text attached to a highlight or to the document itself (document-level notes)
- Both are timestamped and ordered by position in the document

---

## Architecture

### Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS v4
- **Backend**: Next.js API routes running on Cloudflare Workers (via `@cloudflare/next-on-pages` or `opennextjs-cloudflare`)
- **Database**: Cloudflare D1 (SQLite)
- **File Storage**: Cloudflare R2 (EPUBs, PDFs, parsed article HTML, thumbnails)
- **Auth**: Cloudflare Access (Zero Trust, single user)
- **Email**: Cloudflare Email Routing → Email Worker
- **Cron**: Cloudflare Workers Cron Triggers (RSS polling)
- **Browser Extension**: Manifest V3 Chrome extension using wxt (wxt.dev)

### Repository Structure

Full monorepo layout, tooling, and migration workflow: [`docs/repo-structure.md`](docs/repo-structure.md)

### Data Model

Full SQL schema reference: [`docs/schema.sql`](docs/schema.sql). Migrations are applied incrementally from `migrations/*.sql` (see repo-structure doc for workflow).

#### Document
Core entity. All content types are stored as documents.

| Field | Description |
|-------|-------------|
| `id` | Primary key (nanoid) |
| `type` | Content type: `article`, `book`, `pdf`, `email`, `rss_item` |
| `status` | Workflow status: `inbox`, `reading`, `later`, `archive` |
| `is_favorite` | Boolean flag for starring/pinning |
| `is_trashed` | Soft delete flag |
| `trashed_at` | When trashed (for 30-day auto-purge) |
| `title` | Document title |
| `author` | Author name |
| `description` | Summary or excerpt |
| `url` | Original URL (null for uploaded files) |
| `domain` | Extracted from URL for display |
| `image_url` | Thumbnail or cover image URL |
| `language` | Detected content language |
| `word_count` | Total word count |
| `reading_time_minutes` | Estimated reading time |
| `published_at` | Original publish date |
| `reading_progress` | Float 0.0–1.0 |
| `last_read_position` | Scroll position or chapter marker (JSON) |
| `content_r2_key` | R2 key for parsed HTML content |
| `original_r2_key` | R2 key for uploaded file (EPUB, PDF) |
| `feed_id` | FK → Feed (only for RSS items) |
| `source` | How it was saved: `extension`, `manual`, `email`, `feed`, `upload` |
| `created_at` | When saved to the app |
| `updated_at` | Last modified |

**Dependencies**: `feed_id` references Feed. `content_r2_key` and `original_r2_key` point to R2 objects. When `is_trashed` is set, `trashed_at` must also be set.

#### Tag
Flat labels in kebab-case. Many-to-many with Document via DocumentTag join table.

| Field | Description |
|-------|-------------|
| `id` | Primary key (nanoid) |
| `name` | Unique tag name (kebab-case, e.g. `machine-learning`) |
| `color` | Optional display color |
| `created_at` | When created |

#### DocumentTag (join table)
| Field | Description |
|-------|-------------|
| `document_id` | FK → Document |
| `tag_id` | FK → Tag |

**Dependencies**: Cascade delete — removing a Document or Tag removes the association.

#### Highlight
Text selection saved from the reader view, attached to a Document.

| Field | Description |
|-------|-------------|
| `id` | Primary key (nanoid) |
| `document_id` | FK → Document (cascade delete) |
| `text` | The highlighted text |
| `note` | Optional note attached to this highlight |
| `color` | Highlight color: `yellow`, `blue`, `green`, `red`, `purple` |
| `position_data` | JSON with start/end offsets, chapter, percentage — for relocating the highlight in the document |
| `created_at` | When created |
| `updated_at` | Last modified |

**Dependencies**: `document_id` references Document with cascade delete.

#### DocumentNote
Freeform note attached to a Document (not tied to a specific highlight).

| Field | Description |
|-------|-------------|
| `id` | Primary key (nanoid) |
| `document_id` | FK → Document (cascade delete) |
| `content` | Note text (markdown) |
| `created_at` | When created |
| `updated_at` | Last modified |

**Dependencies**: `document_id` references Document with cascade delete.

#### Feed
RSS/Atom feed subscription. One-to-many with Document (feed items).

| Field | Description |
|-------|-------------|
| `id` | Primary key (nanoid) |
| `title` | Feed display name |
| `url` | Feed URL (unique) |
| `site_url` | Website URL |
| `description` | Feed description |
| `icon_url` | Feed/site favicon |
| `folder` | Optional folder grouping |
| `last_fetched_at` | Last poll attempt |
| `last_successful_fetch_at` | Last successful poll |
| `fetch_error` | Error message from last failed fetch |
| `is_active` | Whether polling is enabled |
| `created_at` | When subscribed |

**Dependencies**: Documents with `type='rss_item'` reference this via `feed_id`.

### R2 Storage Structure
```
/articles/{document_id}/content.html    -- parsed readable HTML
/articles/{document_id}/thumbnail.webp  -- thumbnail image
/books/{document_id}/original.epub      -- uploaded EPUB
/books/{document_id}/content/           -- extracted EPUB chapters as HTML
/pdfs/{document_id}/original.pdf        -- uploaded PDF
/emails/{document_id}/content.html      -- parsed email HTML
```

---

## UI Layout

### Three-Panel Layout (Desktop)
Matches the Readwise Reader pattern from the screenshots:

```
+------------------+---------------------------+-------------------+
|     Sidebar      |       Main Content        |   Right Panel     |
|   (240px)        |       (flexible)          |   (320px)         |
|                  |                           |                   |
| Home             |  [Status tabs]            |  Info / Notebook  |
| Library          |  INBOX  READING  LATER    |                   |
|   Articles       |  ARCHIVE                  |  Title            |
|   Books          |                           |  Domain           |
|   Emails         |  [Document list or        |  Author           |
|   PDFs           |   Reader view]            |  Summary          |
| Feeds            |                           |  Metadata         |
|   Manage feeds   |                           |                   |
| Tags             |                           |  -- or --         |
|                  |                           |                   |
| Favorites        |                           |  Document note    |
| Trash            |                           |  Highlights list  |
|                  |                           |                   |
| Search           |                           |                   |
| Preferences      |                           |                   |
+------------------+---------------------------+-------------------+
```

### List View (Main Content — Library/Feeds)
- Each row: thumbnail, title, description snippet, source/domain, reading time, saved date
- Bulk selection with checkboxes
- Sort by: Date saved, Date published, Title, Reading progress
- Filter by: Status tabs (Inbox/Reading/Later/Archive), Type, Tags

### Reader View (Main Content — Single Document)
- Clean, distraction-free reading layout
- Table of contents sidebar (collapsible, extracted from headings)
- Navigation arrows (prev/next document)
- Top toolbar: back, font size (Aa), copy link, share, archive, delete, more options
- Text selection → highlight popup (color picker + add note)
- Reading progress indicator

### Right Panel
Two tabs:
- **Info** — document metadata (type, domain, author, published date, word count, reading time, saved date, progress, language). Edit metadata button.
- **Notebook** — document-level note field + list of all highlights with their notes. Export button.

### Mobile Responsive
- Sidebar collapses to hamburger menu
- Right panel becomes a bottom sheet or separate page
- Single-column layout for list and reader views
- Touch-friendly highlight selection

---

## Keyboard Shortcuts (Vim-Style)

### Navigation
| Key | Action |
|-----|--------|
| `j` | Next item in list / scroll down in reader |
| `k` | Previous item in list / scroll up in reader |
| `Enter` or `o` | Open selected item in reader |
| `Escape` or `u` | Back to list view |
| `g h` | Go to Home |
| `g i` | Go to Inbox |
| `g r` | Go to Reading |
| `g l` | Go to Later |
| `g a` | Go to Archive |
| `g f` | Go to Feeds |
| `g t` | Go to Tags |

### Actions
| Key | Action |
|-----|--------|
| `i` | Move to Inbox |
| `r` | Move to Reading |
| `l` | Move to Later |
| `e` | Move to Archive |
| `s` | Toggle favorite (star) |
| `#` | Move to Trash |
| `t` | Add/edit tags |
| `n` | Add document note |
| `h` | Highlight selected text (in reader) |
| `/` | Focus search |
| `?` | Show keyboard shortcuts help |

### Reader View
| Key | Action |
|-----|--------|
| `ArrowUp/Down` or `j/k` | Scroll |
| `[` / `]` | Previous / next document |
| `c` | Toggle table of contents |
| `p` | Toggle right panel |
| `v` | Open original URL |

---

## Features by Phase

### Phase 1: Foundation & Core Reading (MVP)
**Goal**: Save articles by URL, read them in a clean reader, basic organization.

1. **Project setup**
   - Next.js app with Tailwind CSS v4
   - Cloudflare Workers deployment pipeline (wrangler)
   - D1 database with migrations
   - R2 bucket setup
   - Cloudflare Access auth

2. **Document management**
   - Save article by URL (manual input)
   - Content extraction using Mozilla Readability (or similar)
   - Store parsed HTML in R2, metadata in D1
   - List view with status tabs (Inbox/Reading/Later/Archive)
   - Change document status
   - Delete (soft) and restore from trash

3. **Reader view**
   - Clean reading layout with parsed content
   - Table of contents from headings
   - Reading progress tracking
   - Font size adjustment
   - Open original URL
   - Prev/next document navigation

4. **Three-panel UI layout**
   - Sidebar with navigation
   - Main content area (list + reader)
   - Right panel with Info tab (metadata)

5. **Keyboard shortcuts**
   - All navigation and action shortcuts
   - Shortcut help overlay (`?`)

6. **Search**
   - Full-text search across titles, descriptions
   - Filter by type, status

7. **Mobile responsive layout**
   - Collapsible sidebar
   - Single-column responsive views

### Phase 2: Tags, Notes & Highlights
**Goal**: Full annotation system, organization with tags.

1. **Tags**
   - Create, rename, merge, delete tags
   - Add/remove tags on documents (inline + bulk)
   - Filter by tag in sidebar
   - Tag autocomplete

2. **Highlights**
   - Text selection → highlight popup in reader
   - Color coding (5 colors)
   - Add note to highlight
   - View all highlights in Notebook panel
   - Edit and delete highlights

3. **Document notes**
   - Document-level notes in Notebook panel
   - Rich text (basic markdown)

4. **Right panel — Notebook tab**
   - Document note editor
   - Highlights list with notes
   - Export as markdown

5. **Markdown export**
   - Export single document's notes + highlights
   - Export all notes + highlights (bulk)
   - Template: frontmatter (title, author, url, tags, date) + highlights with notes

6. **UI polish**
   - Persist reading progress to D1 (UI progress bar exists, but progress isn’t written back yet)
   - Close left / right panels like in Readwise (`[` / `]`)
   - Font size adjustment in reader
   - Add Dark  mode

### Phase 3: RSS Feeds
**Goal**: Subscribe to and read RSS feeds within the app.

1. **Feed management**
   - Add feed by URL (auto-discover RSS from site URL)
   - List subscribed feeds with metadata (name, description, document count, last updated)
   - Edit feed (rename, assign folder)
   - Delete/unsubscribe feed
   - Feed folders for grouping

2. **Feed polling**
   - Cloudflare Workers Cron Trigger (every 30 minutes)
   - Parse RSS/Atom feeds
   - Create documents for new items
   - Track last fetched timestamp
   - Error handling and retry

3. **Feeds view**
   - Sidebar entry for Feeds
   - Same status tabs (Inbox/Reading/Later/Archive)
   - Filter by individual feed or folder
   - Mark as read (bulk)

### Phase 4: File Uploads (EPUB & PDF)
**Goal**: Upload and read books and PDFs in-app.

1. **EPUB support**
   - Upload EPUB files → store in R2
   - Parse EPUB (extract chapters, metadata, cover image)
   - In-app EPUB reader with chapter navigation
   - Highlighting and notes within EPUB content
   - Reading progress per chapter

2. **PDF support**
   - Upload PDF files → store in R2
   - In-app PDF viewer (using pdf.js or similar)
   - Basic highlighting support on PDF
   - Page-level navigation and progress tracking

3. **File management**
   - Upload UI with drag-and-drop
   - Book/PDF metadata editing (title, author, cover)
   - Storage usage display

### Phase 5: Newsletter / Email Integration
**Goal**: Receive newsletters directly in the app.

1. **Cloudflare Email Routing setup**
   - Configure catch-all email routing on subdomain `read.annjose.com` (`*@read.annjose.com` → Email Worker)
   - Subscribe to newsletters with per-source addresses (e.g., `techcrunch@read.annjose.com`, `stratechery@read.annjose.com`)
   - Email Worker to receive and process incoming emails
   - Identify source from the `to` address
   - Parse email HTML content, extract readable text
   - Store as document with type 'email'

2. **Newsletter management**
   - View newsletters in Library (filtered by type)
   - Sender grouping
   - Unsubscribe tracking (manual)

3. **Gmail forwarding (optional)**
   - Instructions/setup for forwarding specific newsletters from Gmail to `{source}@read.annjose.com`

### Phase 6: Browser Extension
**Goal**: One-click save from Chrome.

1. **Chrome Extension (Manifest V3)**
   - Extension popup with "Save to Canopy" button
   - Saves current page URL to the app
   - Shows confirmation with link to open in Canopy
   - Badge showing save status

2. **Extension features**
   - Keyboard shortcut to save (configurable, e.g., `Alt+Shift+S`)
   - Right-click context menu "Save to Canopy"
   - Auto-detect if page is already saved

### Phase 7: Obsidian Integration
**Goal**: Sync notes and highlights with Obsidian.

1. **One-way export (initial)**
   - Export all notes/highlights as markdown files
   - Configurable export directory path
   - Markdown template with frontmatter
   - Download as ZIP or copy to local folder

2. **Obsidian plugin or sync (future)**
   - Auto-sync new highlights to Obsidian vault
   - Two-way sync: edits in Obsidian reflect in Canopy
   - Conflict resolution strategy

### Phase 8: Polish & Advanced Features
1. **Reading statistics** — daily/weekly reading time, documents read
2. **Bulk operations** — multi-select, bulk tag, bulk status change
3. **Import from Readwise** — CSV/JSON import of existing library
4. **Dark mode**
5. **Customizable reader themes** (font, spacing, width)
6. **Text-to-speech** (optional)

---

## Markdown Export Template

```markdown
---
title: "{{title}}"
author: "{{author}}"
url: "{{url}}"
domain: "{{domain}}"
type: "{{type}}"
tags: [{{tags}}]
saved: "{{created_at}}"
published: "{{published_at}}"
reading_progress: {{reading_progress}}
---

# {{title}}

## Document Notes
{{document_notes}}

## Highlights

{{#each highlights}}
> {{text}}

{{#if note}}
**Note**: {{note}}
{{/if}}

---
{{/each}}
```

---

## Cloudflare Infrastructure

### Wrangler Configuration
- **Workers**: Main Next.js app + Email Worker + RSS Cron Worker
- **D1**: Single database for all app data
- **R2**: Single bucket for all file storage
- **Cron Triggers**: `*/30 * * * *` for RSS feed polling
- **Email Routing**: `*@read.annjose.com` (catch-all) → Email Worker
- **Access**: Zero Trust policy, single user (ann.jose@gmail.com)

### Environment Variables
```
CLOUDFLARE_ACCOUNT_ID
D1_DATABASE_ID
R2_BUCKET_NAME
CLOUDFLARE_ACCESS_CLIENT_ID
CLOUDFLARE_ACCESS_CLIENT_SECRET
APP_URL  # https://canopy.annjose.com
```

---

## Open Questions / Future Considerations
- ~~App name and domain~~ → **Canopy** at `canopy.annjose.com`
- Reading position sync across devices
- Offline reading support (service worker)
- API for third-party integrations
- Mobile app (PWA vs native)

---

## Implementation Progress

| Phase | Description | Status | Plan |
|-------|-------------|--------|------|
| 1 | Foundation & Core Reading (MVP) | **Mostly complete** | [`docs/plans/phase-1-foundation.md`](docs/plans/phase-1-foundation.md) |
| 2 | Tags, Notes & Highlights | Not started | |
| 3 | RSS Feeds | Not started | |
| 4 | File Uploads (EPUB & PDF) | Not started | |
| 5 | Newsletter / Email Integration | Not started | |
| 6 | Browser Extension | Not started | |
| 7 | Obsidian Integration | Not started | |
| 8 | Polish & Advanced Features | Not started | |

**Phase 1 note**: the MVP is working end-to-end (save by URL → read → organize) with keyboard shortcuts, command palette search, mobile layout, and Cloudflare Access enforcement on API routes. Remaining Phase 1 items are optional polish (e.g., persisting reading progress, reader font size controls, prev/next navigation).
