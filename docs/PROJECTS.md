# My Verse — Projects, Sections & Content

> Phase 2 content model: **Project** (BOOK | PHOTOSHOOT | SHOW), **Sections**, and **SectionItems**.  
> See also: [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [SETUP.md](./SETUP.md) · [REGISTRATION.md](./REGISTRATION.md) · [PROJECTS.md](./PROJECTS.md) · [CONTENT_CREATION_GUIDE.md](./CONTENT_CREATION_GUIDE.md)

---

See **[CONTENT_CREATION_GUIDE.md](./CONTENT_CREATION_GUIDE.md)** for a step-by-step guide (Books, Photoshoots, Shows, many sections, default statuses).

A **Project** is the central publishable entity. Three types share the same section/item structure but enforce different content rules:

| Type | Use case | Type extension fields |
|------|----------|----------------------|
| `BOOK` | Written stories | `summary` (optional) |
| `PHOTOSHOOT` | Image galleries | `theme`, `location` (optional) |
| `SHOW` | Video content (movie or series) | `genre` (optional) |

**Sections** are creator-defined containers (e.g. "Chapter 1", "Episode 3", "Session A").  
**SectionItems** hold the actual content: `TEXT`, `IMAGE`, or `VIDEO`.

---

## Domain model

```
Project (BOOK | PHOTOSHOOT | SHOW)
 ├── BookProject | PhotoshootProject | ShowProject  (1:1 type extension)
 └── Section[]
      └── SectionItem[]  (TEXT | IMAGE | VIDEO)
```

### Project fields

| Field | Notes |
|-------|--------|
| `type` | `BOOK` \| `PHOTOSHOOT` \| `SHOW` |
| `title`, `slug` | Unique slug (auto-generated from title if omitted) |
| `description` | Short blurb |
| `status` | `DRAFT` \| `PUBLISHED` \| `UNPUBLISHED` \| `DELETED` |
| `visibility` | `PUBLIC` \| `AUTHENTICATED` \| `STAFF_ONLY` \| `PRIVATE` |
| `isAdult` | NSFW flag |
| `createdBy` | Admin user ID |
| `publishedAt` | Nullable |

### Section fields

| Field | Notes |
|-------|--------|
| `projectId` | Parent project |
| `label` | Creator-defined label |
| `description` | Optional |
| `sortOrder` | Integer, reorderable |
| `status` | `DRAFT` \| `PUBLISHED` \| `UNPUBLISHED` |
| `publishedAt` | Nullable |

Sections can be added **after** the project is published. Default labels (e.g. "Session 1") are frontend suggestions only.

### SectionItem fields

| Field | Notes |
|-------|--------|
| `sectionId`, `projectId` | Foreign keys |
| `kind` | `TEXT` \| `IMAGE` \| `VIDEO` |
| `label` | Optional per-item label |
| `textContent` | For `TEXT` kind |
| `file` | `FileMeta` for `IMAGE` / `VIDEO` |
| `durationSeconds` | Required for `VIDEO` |
| `sortOrder` | Integer, reorderable |

---

## Type-specific validation

| Type | Section rules |
|------|----------------|
| **BOOK** | `TEXT` allowed; optional `IMAGE` / `VIDEO` per section |
| **PHOTOSHOOT** | 1–120 `IMAGE` items per section only |
| **SHOW** | At most 1 `VIDEO` per section; optional `TEXT` |

### Project-level aggregate limits (enforced on create/update and publish)

| Resource | Limit |
|----------|--------|
| Text | ≤ 5,000,000 characters per project |
| Images | ≤ 120 images, ≤ 60 MB total per project |
| Video | ≤ 120 minutes, ≤ 500 MB total per project |

---

## Publishing

Two-level publish model:

| Level | Who | Public visibility |
|-------|-----|-------------------|
| **Project** | Admin only | Catalog lists project only if `status === PUBLISHED` + visibility/NSFW pass |
| **Section** | Admin only | Content visible only if project is `PUBLISHED` **and** section is `PUBLISHED` |

- A project **may** be published with zero published sections (empty shell / "coming soon").
- New sections can be drafted after the project is live, then published individually.
- Sections may be **unpublished** without unpublishing the whole project.

---

## Access control

`ProjectAccessService` enforces visibility + NSFW on public read routes:

| Viewer | Non-adult public project | Adult project | Staff-only |
|--------|-------------------------|---------------|------------|
| Anonymous | View if `PUBLIC` | Denied | Denied |
| Logged-in public | View if visibility allows | View if `nsfwEnabled` | Denied |
| Staff | View per visibility | View if `nsfwEnabled` | View if `STAFF_ONLY` |
| Admin | Always | Always | Always |

Public `GET /projects` and `GET /projects/:id` accept an optional JWT (for visibility and NSFW). Admin sees all non-deleted projects when authenticated as admin.

---

## Media upload

Two-step flow (same pattern as profile pictures):

### 1. Upload file

```bash
# Project image (jpeg/png/webp, max 10 MB)
curl -X POST http://localhost:3000/api/v1/media/upload/image \
  -F "file=@./photo.jpg"

# Project video (mp4/webm, max 500 MB)
curl -X POST http://localhost:3000/api/v1/media/upload/video \
  -F "file=@./clip.mp4" \
  -F "durationSeconds=120"
```

### 2. Reference ImageFileMeta in item create/update

Pass the returned `data` object as `file` in the section item JSON body (for IMAGE items).

**Image storage:** MongoDB `media` collection (BSON Binary). Render with `<img src="{origin}{file.url}">` — returns raw image bytes, not JSON.

**Video storage:** disk at `.uploads/videos/`, served at `/uploads/videos/<path>`.

### List projects pagination

`GET /projects?page=1&perPage=20` — response includes `meta: { page, perPage, total, totalPages }`.

---

## API reference (`/api/v1`)

### Projects

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| `POST` | `/projects` | Admin | Create with `type` + type extension payload |
| `GET` | `/projects` | Public (+ optional JWT) | Admin: all; Public: published + filtered. Paginated: `?page=1&perPage=20` |
| `GET` | `/projects/:id` | Public (+ optional JWT) | Admin: full; Public: published sections only |
| `PATCH` | `/projects/:id` | Admin | Update base + type extension fields |
| `DELETE` | `/projects/:id` | Admin | Soft-delete (`DELETED`) |
| `POST` | `/projects/:id/publish` | Admin | Validates aggregate limits |
| `POST` | `/projects/:id/unpublish` | Admin | |
| `PATCH` | `/projects/:id/visibility` | Admin | Body: `{ "visibility": "PUBLIC" }` |

### Sections

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/projects/:projectId/sections` | Admin |
| `PATCH` | `/projects/:projectId/sections/:sectionId` | Admin |
| `DELETE` | `/projects/:projectId/sections/:sectionId` | Admin |
| `PATCH` | `/projects/:projectId/sections/reorder` | Admin — body: `{ "sectionIds": ["..."] }` |
| `POST` | `/projects/:projectId/sections/:sectionId/publish` | Admin |
| `POST` | `/projects/:projectId/sections/:sectionId/unpublish` | Admin |

### Section items

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/projects/:projectId/sections/:sectionId/items` | Admin |
| `PATCH` | `/projects/:projectId/sections/:sectionId/items/:itemId` | Admin |
| `DELETE` | `/projects/:projectId/sections/:sectionId/items/:itemId` | Admin |
| `PATCH` | `/projects/:projectId/sections/:sectionId/items/reorder` | Admin — body: `{ "itemIds": ["..."] }` |

### Media (Phase 2 extensions)

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/media/upload` | Profile images (Phase 1) |
| `POST` | `/media/upload/image` | Project images |
| `POST` | `/media/upload/video` | Project videos; requires `durationSeconds` |

---

## Example: BOOK flow

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myverse.local","password":"change-me-before-deploy"}' \
  | jq -r '.data.accessToken')

# 2. Create book project
PROJECT=$(curl -s -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"BOOK","title":"My First Book","bookDetails":{"summary":"A tale."}}')
PROJECT_ID=$(echo $PROJECT | jq -r '.data.id')

# 3. Add section
SECTION=$(curl -s -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/sections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Chapter 1"}')
SECTION_ID=$(echo $SECTION | jq -r '.data.id')

# 4. Add text item
curl -s -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/sections/$SECTION_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"TEXT","textContent":"Once upon a time..."}'

# 5. Publish section, then project
curl -s -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/sections/$SECTION_ID/publish \
  -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/publish \
  -H "Authorization: Bearer $TOKEN"

# 6. Public read
curl -s http://localhost:3000/api/v1/projects/$PROJECT_ID
```

---

## Phase 3 (deferred)

Not implemented in Phase 2:

- `Character` on project (BOOK/SHOW)
- Cast requests, staff accept/decline
- Publish gate when casts are pending

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the full roadmap.

---

## Document history

| Date | Change |
|------|--------|
| 2026-06-29 | Phase 2 — Project/Section/SectionItem model and API |
