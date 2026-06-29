# My Verse — Content Creation Guide

> A practical guide for developers building admin tools or integrating with the API.  
> Explains how to create **Books**, **Photoshoots**, and **Shows** — including projects with many sections — and what default statuses mean at each step.

**Related docs:** [PROJECTS.md](./PROJECTS.md) (API reference) · [SETUP.md](./SETUP.md) (local setup) · [PROJECT_PLAN.md](./PROJECT_PLAN.md) (product plan) · [Postman](../postman/README.md)

---

## The big picture

Think of content in three layers:

```
Project          ← the thing on the catalog (a book, a shoot, a show)
  └── Section    ← a chapter, session, or episode (you choose the label)
        └── Item ← a paragraph, photo, or video clip inside that section
```

Only **admins** create and publish content. Everyone else reads it according to visibility and NSFW rules.

Publishing works at **two levels**:

1. **Project** — appears in the catalog when published.
2. **Section** — its items are visible only when that section is also published.

So a live book can show "Chapter 1" today and "Chapter 2" next week — you publish the project once, then publish new sections as they are ready.

---

## Default values when you create something

When you call the API, the server sets sensible defaults. You usually do not need to send these fields on create.

### New project

| Field | Default | What it means |
|-------|---------|---------------|
| `status` | `DRAFT` | Not visible to the public. Safe to edit. |
| `visibility` | `PUBLIC` | Once published, anyone can see it (unless NSFW blocks them). |
| `isAdult` | `false` | Treated as safe for all audiences until you mark it adult. |
| `slug` | Auto from `title` | URL-friendly identifier (e.g. `"My Story"` → `my-story`). |
| `publishedAt` | `null` | Set automatically when you publish. |

### New section

| Field | Default | What it means |
|-------|---------|---------------|
| `status` | `DRAFT` | Hidden from public even if the project is already live. |
| `sortOrder` | Next number | First section is `0`, second is `1`, and so on. |
| `publishedAt` | `null` | Set when you publish the section. |

### New section item

| Field | Default | What it means |
|-------|---------|---------------|
| `sortOrder` | Next number | Items appear in the order they were added unless you reorder. |

Items do **not** have their own publish status. They go live when their parent section is published.

---

## Status lifecycle (plain language)

### Project statuses

| Status | Who sees it | Typical use |
|--------|-------------|-------------|
| `DRAFT` | Admin only | Work in progress. |
| `PUBLISHED` | Public (per visibility rules) | Live on the catalog. |
| `UNPUBLISHED` | Admin only | Taken down but kept in the database. |
| `DELETED` | Admin only (soft delete) | Removed from normal lists; not shown to public. |

### Section statuses

| Status | Who sees it (when project is published) | Typical use |
|--------|----------------------------------------|-------------|
| `DRAFT` | Nobody (public) | Writing chapter 5 before release. |
| `PUBLISHED` | Everyone allowed by visibility | Chapter is live. |
| `UNPUBLISHED` | Nobody (public) | Pull one episode without taking down the whole show. |

---

## What the public actually sees

For a non-admin visitor calling `GET /projects` or `GET /projects/:id`:

- Only projects with `status: PUBLISHED`.
- Visibility must allow them (`PUBLIC`, logged-in for `AUTHENTICATED`, etc.).
- Adult projects require `nsfwEnabled` on their account.
- Inside a project, **only sections with `status: PUBLISHED`** are returned.
- Draft sections and their items are invisible — as if they do not exist.

Admins bypass these filters when authenticated.

---

## The standard workflow (all types)

Every project type follows the same rhythm:

```
1. Log in as admin
2. Create the project (starts as DRAFT)
3. Add one or more sections (each starts as DRAFT)
4. Add items to each section
5. Publish each section when its content is ready
6. Publish the project when it should appear on the catalog
```

You can publish the **project before all sections** are ready — useful for a "Coming soon" listing. Readers will see the project card but no section content until you publish sections.

You can also **add and publish new sections after** the project is already live — useful for serial books or weekly episodes.

### Reordering

If you add many sections, order matters for reading flow:

- `PATCH .../sections/reorder` — pass `sectionIds` in the order you want.
- `PATCH .../items/reorder` — same for items inside a section.

---

## Creating a Book (many chapters)

A **book** is for written content. Each section is usually a chapter, but the label is entirely up to you ("Chapter 1", "Prologue", "Part II", etc.).

### What goes inside a section

| Item kind | Allowed? | Notes |
|-----------|----------|-------|
| `TEXT` | Yes | Main story body. |
| `IMAGE` | Yes | Illustrations, maps, etc. |
| `VIDEO` | Yes | Optional embedded clips. |

### Example: novel with 12 chapters

1. **Create the book**
   ```json
   POST /projects
   {
     "type": "BOOK",
     "title": "The Long Road",
     "description": "A fantasy epic",
     "bookDetails": { "summary": "Optional longer blurb for the detail page." }
   }
   ```
   → Project is `DRAFT`, `visibility: PUBLIC`.

2. **Add chapters** — repeat for each chapter:
   ```json
   POST /projects/{projectId}/sections
   { "label": "Chapter 1", "description": "The beginning" }
   ```
   → Each section is `DRAFT`, `sortOrder` 0, 1, 2, …

3. **Add text (and optional media) per chapter**
   ```json
   POST /projects/{projectId}/sections/{sectionId}/items
   { "kind": "TEXT", "textContent": "The road stretched ahead..." }
   ```

4. **Publish when ready**
   - Publish Chapter 1: `POST .../sections/{sectionId}/publish`
   - When enough chapters are live (or even zero): `POST .../projects/{projectId}/publish`

5. **Release later chapters** — add Chapter 2 as `DRAFT`, finish writing, publish that section. The book stays `PUBLISHED`; only the new chapter goes live.

### Tips for books with many sections

- Create all section shells first (empty labels in order), then fill items — or grow one chapter at a time.
- Use **reorder** if you insert a chapter in the middle after the fact.
- Text is counted toward the **5 million character** project limit across all sections.

---

## Creating a Photoshoot (many sessions)

A **photoshoot** is for image galleries. Each section is typically a session, look, or set — again, you pick the label ("Session A", "Beach Day", "Look 3").

### What goes inside a section

| Item kind | Allowed? | Notes |
|-----------|----------|-------|
| `IMAGE` | Yes | **Only** images are allowed. |
| `TEXT` | No | Use the section `description` or project `description` for context. |
| `VIDEO` | No | Use a SHOW project for video. |

Each section can have **1 to 120 images**. Each image can have an optional `label` (e.g. "Wide shot", "Close-up").

### Example: fashion shoot with 4 sessions

1. **Create the photoshoot**
   ```json
   POST /projects
   {
     "type": "PHOTOSHOOT",
     "title": "Summer Collection",
     "photoshootDetails": { "theme": "Coastal", "location": "Malibu" }
   }
   ```

2. **Add sessions (sections)**
   ```json
   POST /projects/{projectId}/sections
   { "label": "Session 1 — Golden hour" }
   ```

3. **Upload images, then attach them**
   - Upload: `POST /media/upload/image` with the file → returns `FileMeta`.
   - Add item:
     ```json
     POST /projects/{projectId}/sections/{sectionId}/items
     {
       "kind": "IMAGE",
       "label": "Hero shot",
       "file": { "...FileMeta from upload..." }
     }
     ```
   - Repeat for each photo in the session.

4. **Publish** each session, then the project.

### Tips for large photoshoots

- Upload files first, then batch-create items using the returned `FileMeta` objects.
- Project-wide limits: **120 images** and **60 MB** total image size across all sections.
- Per-image upload cap: **10 MB** (jpeg, png, webp).

---

## Creating a Show (movie or series)

A **show** is for video. One section = one episode or one movie part. A single-section show works well for a **movie**; many sections work for a **series**.

### What goes inside a section

| Item kind | Allowed? | Notes |
|-----------|----------|-------|
| `VIDEO` | Yes | **At most one** video per section. |
| `TEXT` | Yes | Optional synopsis, credits, notes. |
| `IMAGE` | No | Use PHOTOSHOOT for stills. |

### Example: 8-episode series

1. **Create the show**
   ```json
   POST /projects
   {
     "type": "SHOW",
     "title": "Midnight Signals",
     "showDetails": { "genre": "Sci-fi thriller" }
   }
   ```

2. **Add episodes (sections)**
   ```json
   POST /projects/{projectId}/sections
   { "label": "Episode 1 — Static", "description": "Pilot" }
   ```

3. **Upload video, then attach**
   - Upload: `POST /media/upload/video` with `file` and `durationSeconds` → returns `FileMeta` + duration.
   - Add item:
     ```json
     POST /projects/{projectId}/sections/{sectionId}/items
     {
       "kind": "VIDEO",
       "file": { "...FileMeta..." },
       "durationSeconds": 3420
     }
     ```

4. **Optional text** — episode recap or chapter cards:
   ```json
   { "kind": "TEXT", "textContent": "Previously on..." }
   ```

5. **Publish** episode 1’s section, publish the show, then publish episode 2’s section next week without unpublishing the show.

### Example: single movie (one section)

1. Create `SHOW` project.
2. Add one section: `{ "label": "Full film" }`.
3. Add one `VIDEO` item.
4. Publish section → publish project.

### Tips for shows

- Project-wide video limits: **120 minutes** total duration and **500 MB** total file size.
- `durationSeconds` is required on video items and must match what you send on upload.

---

## Visibility and adult content

Set these on the project (not per section):

| `visibility` | Who can view (when published) |
|--------------|-------------------------------|
| `PUBLIC` | Anyone (subject to NSFW) |
| `AUTHENTICATED` | Logged-in users only |
| `STAFF_ONLY` | Staff and admin |
| `PRIVATE` | Admin only |

| `isAdult` | Effect |
|-----------|--------|
| `false` | Default. Everyone who passes visibility can view. |
| `true` | Viewers need `nsfwEnabled: true` on their account (except admin). |

Change visibility anytime: `PATCH /projects/{id}/visibility`.

---

## Common patterns

### "Coming soon" listing

1. Create project, add zero sections (or draft sections).
2. Publish the project.
3. Public sees the title and description but no chapters/episodes yet.
4. Publish sections as content is ready.

### Serial / episodic release

1. Project stays `PUBLISHED`.
2. New sections start as `DRAFT`.
3. When an episode is ready: `POST .../sections/{id}/publish`.
4. To pull an episode: `POST .../sections/{id}/unpublish` — the rest of the show stays up.

### Take down entire project

`POST /projects/{id}/unpublish` — hides everything from the public. Sections keep their statuses; republishing the project restores whatever sections were already `PUBLISHED`.

### Remove permanently from catalog

`DELETE /projects/{id}` — soft-deletes (`status: DELETED`). Not shown in public or normal admin lists.

---

## Quick reference: defaults and limits

| | Book | Photoshoot | Show |
|---|------|------------|------|
| **Section label examples** | Chapter 1, Prologue | Session A, Look 2 | Episode 3, Full film |
| **Primary content** | TEXT | IMAGE | VIDEO |
| **Items per section** | Many (mixed types) | 1–120 images | 1 video (+ optional text) |
| **Project on create** | `DRAFT`, `PUBLIC` visibility | Same | Same |
| **Section on create** | `DRAFT`, auto `sortOrder` | Same | Same |

**Project-wide limits (all types):** 5M text characters · 120 images / 60 MB · 120 min video / 500 MB.

---

## Testing with Postman or curl

See [SETUP.md](./SETUP.md) for curl examples and [postman/README.md](../postman/README.md) for the recommended click-through flow:

```
Auth → Login (Admin)
Projects → Create Book / Photoshoot / Show
Sections → Create Section (repeat for many sections)
Section Items → Add Text / Image / Video
Sections → Publish Section
Projects → Publish Project
Projects → Get Project (no auth) — verify public view
```

For field-level API detail, see [PROJECTS.md](./PROJECTS.md).

---

## Document history

| Date | Change |
|------|--------|
| 2026-06-29 | Initial content creation guide for Books, Photoshoots, and Shows |
