# My Verse — Backend Project Plan

> High-level product and technical plan for the **My Verse** NestJS backend.  
> A specialized Creative Universe Management System.

**Related docs:** [AUTH.md](./AUTH.md) · [SETUP.md](./SETUP.md) · [REGISTRATION.md](./REGISTRATION.md) · [Postman](../postman/README.md)

---

## Table of Contents

1. [Vision](#vision)
2. [Technical Stack](#technical-stack)
3. [API Conventions](#api-conventions)
4. [User Types & Permissions](#user-types--permissions)
5. [Registration & Accounts](#registration--accounts)
6. [Content Model](#content-model)
7. [Casting Workflow](#casting-workflow)
8. [Publishing & Visibility](#publishing--visibility)
9. [Access Control](#access-control)
10. [Media & Storage](#media--storage)
11. [MVP Scope](#mvp-scope)
12. [Deferred Features](#deferred-features)
13. [Domain Model](#domain-model)
14. [NestJS Module Map](#nestjs-module-map)
15. [API Surface (High Level)](#api-surface-high-level)
16. [Build Order](#build-order)
17. [Open Decisions](#open-decisions)
18. [Document History](#document-history)
19. [Postman Collections](#postman-collections)

---

## Vision

**My Verse** is a creative universe platform — a mix between Netflix and Instagram — where an admin publishes interconnected entertainment content and casts real staff as fictional characters. Different audiences (admin, staff, public) interact with that content at different permission levels.

The project itself **is** the multiverse. There are no separate universe/franchise containers — just various stories and ideas within one shared world.

### Content philosophy

Posts are **not** rigidly typed as separate products (Movie vs Photoshoot vs Book). A single post can contain **any mix of text, images, and video**, in **any order**, of **any length** (within defined limits). Book-specific structure (chapters, characters) applies where relevant, but content blocks remain flexible.

Posts have **no structural relationship** to each other.

---

## Technical Stack

| Concern | Choice |
|---------|--------|
| Framework | NestJS (latest) |
| Database | MongoDB |
| ODM | Mongoose (`@nestjs/mongoose`) |
| Auth | JWT bearer token (`@nestjs/passport`, `@nestjs/jwt`) |
| Validation | `class-validator` + DTOs |
| File upload | `@nestjs/platform-express` + `multer` |
| Role enforcement | Hardcoded permissions + `@Roles()` / `@RequirePermission()` guards |
| Media storage | Local `.uploads/` directory (gitignored) |
| Clients | Web and mobile (this repo is API-only) |

### Infrastructure notes

- **API versioning** — all routes prefixed with `/api/v1`
- **Rate limiting** — not implemented in this app; handled by a separate gateway/service
- **Admin bootstrap** — manual seeder script run by deployment team before first start (see [SETUP.md](./SETUP.md))

---

## API Conventions

### Base URL

```
/api/v1
```

### Response envelope

All API responses use a consistent shape:

**Success:**

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

`meta` is optional — used for pagination (`page`, `limit`, `total`) and similar.

**Error:**

```json
{
  "success": false,
  "data": null,
  "meta": {
    "message": "Human-readable error",
    "statusCode": 400,
    "errors": []
  }
}
```

Implemented via a global response interceptor and exception filter.

### Authentication

Protected routes expect:

```
Authorization: Bearer <accessToken>
```

The login endpoint returns a JWT access token. Refresh tokens are **not** used in v1.

---

## User Types & Permissions

**Admin, Staff, and Public are all `User` records.** Role distinguishes behavior — there is no separate login system per type.

| Role | Description |
|------|-------------|
| **ADMIN** | Full access to everything. Only role that can publish posts and assign staff to characters. Can activate/deactivate accounts. |
| **STAFF** | Performers. Extended profile (see [Registration & Accounts](#registration--accounts)). Can view content, respond to cast requests, and manage own staff profile. |
| **PUBLIC** | General audience. Base user fields only. Can view content per visibility rules. |

### Permission model (v1)

Three roles with **hardcoded permissions in code** — no `roles` or `permissions` collections in MongoDB.

| Permission | ADMIN | STAFF | PUBLIC |
|------------|:-----:|:-----:|:------:|
| `users:manage` | ✓ | — | — |
| `users:read:self` | ✓ | ✓ | ✓ |
| `users:update:self` | ✓ | ✓ | ✓ |
| `staff:read` | ✓ | ✓ | ✓ |
| `staff:update:self` | ✓ | ✓ | — |
| `posts:crud` | ✓ | — | — |
| `posts:publish` | ✓ | — | — |
| `posts:read` | ✓ | ✓ | ✓ |
| `cast:respond` | ✓ | ✓ | — |

**Staff and Public are almost identical** for now. The main differences: Staff has an extended profile, can update it, and can respond to cast requests (when casting is implemented).

Admin can do **any and everything**.

See [AUTH.md](./AUTH.md) for schemas, endpoints, and auth flows.

### Account lifecycle

- **Unique email** — one account per email address
- **Unique username** — one account per username
- **Activate / deactivate** — Admin sets `isActive`. Inactive users cannot log in. Prefer deactivation over hard delete in v1.
- **NSFW** — users have `nsfwEnabled` (default `false`). Required to view adult-tagged content.

---

## Registration & Accounts

### Base `User` fields (everyone)

| Field | Notes |
|-------|--------|
| `email` | Unique, used for login |
| `username` | Unique |
| `password` | Stored as hash only |
| `displayName` | Optional display name |
| `profilePicture` | Optional `FileMeta` (see [REGISTRATION.md](./REGISTRATION.md)) |
| `role` | `ADMIN` \| `STAFF` \| `PUBLIC` |
| `isActive` | Default `true`; Admin can toggle |
| `nsfwEnabled` | Default `false` |
| `defaultVisibility` | Optional; used when user publishes (mainly Admin) |

### `StaffProfile` (role `STAFF` only)

Separate collection linked to `User` via `userId`. Public users do not have a staff profile.

Extended fields include performer metadata (stage name, bio, skills, social links, etc.). Full field list: [REGISTRATION.md](./REGISTRATION.md).

| Field | Notes |
|-------|--------|
| `isProfileComplete` | `true` when user has `profilePicture` + staff has `stageName` and `bio` |

Profile photo lives on **`User.profilePicture`** (`FileMeta`), not on StaffProfile.

Incomplete staff profiles may be hidden from public staff listings.

### Registration paths

See **[REGISTRATION.md](./REGISTRATION.md)** for full field specs.

```
Step 0 — Upload profile picture (optional for PUBLIC, required for STAFF)
  POST /api/v1/media/upload  → FileMeta

Path A — Public self-register
  POST /api/v1/auth/register  (JSON + optional profilePicture FileMeta)
  → role: PUBLIC

Path B — Staff self-register
  POST /api/v1/auth/register/staff  (JSON + required profilePicture FileMeta)
  → role: STAFF + StaffProfile

Path C — Admin creates account
  POST /api/v1/users  (admin only)
  → profilePicture FileMeta required for STAFF
```

---

## Content Model

### Post

The central publishable entity.

| Field | Notes |
|-------|--------|
| `title`, `slug` | Identity and URL |
| `description` | Optional summary |
| `status` | `DRAFT` \| `PUBLISHED` \| `UNPUBLISHED` \| `DELETED` |
| `visibility` | Per-post setting (see [Publishing & Visibility](#publishing--visibility)) |
| `isAdult` | NSFW flag |
| `createdBy` | Admin user ID |
| `publishedAt` | Nullable timestamp |

### Episodic / web-series model

A story (post) can be **published first** with zero or some chapters. Additional chapters can be **added after publish** and released over time — like a web series with episodes dropping on later dates.

```
Post published (shell or with initial chapters)
        ↓
Admin adds Chapter 2 next week
        ↓
Admin adds Chapter 3 later
        ↓
Readers see new chapters as they are published
```

Each chapter may have its own `publishedAt` and visibility in a future iteration. MVP: chapters belong to a post; post-level publish gate applies.

### Content Blocks (ordered, polymorphic)

Each post (or chapter — see open decisions) contains an ordered list of content blocks:

| Type | Payload |
|------|---------|
| `TEXT` | Text body |
| `IMAGE` | File reference + metadata |
| `VIDEO` | File reference + duration metadata |

Blocks are sorted by `sortOrder`.

### Book structure (on a post)

#### Chapter

- Belongs to a post
- `title`, `sortOrder`, optional `publishedAt`
- Can be added before or after post is published

#### Character (fictional)

- Belongs to a post
- `name`, `bio`, optional `avatar`
- **Not** 1:1 with staff — characters are fictional entities

#### Cast assignment

- Links a **fictional character** to a **real staff user** (`role: STAFF`)
- A staff member can be cast on **multiple posts** as the **same or different** characters
- Status: `PENDING` \| `ACCEPTED` \| `DECLINED` \| `REVOKED`

---

## Casting Workflow

Staff are real users. Characters they play are fictional.

```
Admin creates draft post + characters
        ↓
Admin sends cast request (Staff A → Character X on Post P)
        ↓
Staff receives request → Accept or Decline
        ↓
Post cannot be published until all required casts are ACCEPTED
        ↓
Admin publishes
```

### Rules

- Cast requests are sent **to the staff member**, who must **accept** before they appear on published content.
- Only Admin can send cast requests (for MVP).

---

## Publishing & Visibility

### Publishing

- **Only Admin** can publish posts and chapters.
- No scheduled publish at the API level (v1).
- Drafts can be **unpublished** or **deleted** (soft delete preferred).
- Publish is blocked if required cast assignments are not `ACCEPTED`.

### Visibility

Visibility can be set:

1. **Per post** — overrides defaults, or
2. **Global default** — in the user's `defaultVisibility` setting

| Value | Meaning |
|-------|---------|
| `PUBLIC` | Anyone (subject to NSFW rules) |
| `AUTHENTICATED` | Logged-in users only |
| `STAFF_ONLY` | Staff and Admin |
| `PRIVATE` | Admin only |

**Resolution order:** per-post setting → poster's `defaultVisibility` → system default (`PUBLIC`).

---

## Access Control

| Viewer | Non-adult public post | Adult post | Staff-only post |
|--------|----------------------|------------|-----------------|
| Anonymous | View if `PUBLIC` | Denied | Denied |
| Logged-in public | View if visibility allows | View if `nsfwEnabled` | Denied unless allowed |
| Staff | View per visibility | View if `nsfwEnabled` | View if `STAFF_ONLY` or broader |
| Admin | Always | Always | Always |

Login is required to **interact** (rate, comment) — interaction features are deferred in MVP.

Implement as a shared policy service / guard (`PostAccessGuard`).

---

## Media & Storage

### Directory layout

```
.uploads/           # gitignored
├── profiles/       # staff profile images (Phase 1)
├── images/         # post content images (later)
└── videos/         # post content videos (later)
```

### Access (v1)

`.uploads/` is **publicly served** for now. Authenticated/signed URLs may be added later.

### Per-post limits (enforced on upload and publish)

| Type | Limit |
|------|--------|
| **Text** | ≤ 5,000,000 characters per post |
| **Images** | ≤ 120 images, ≤ 60 MB total per post |
| **Video** | ≤ 120 minutes, ≤ 500 MB total per post |

### Profile image limits (Phase 1)

| Type | Limit |
|------|--------|
| **Profile image** | ≤ 5 MB; jpg, png, webp only |

Abstract uploads behind a `StorageService` for future cloud migration.

---

## MVP Scope

### Phase 1 — Auth foundation (completed)

- [x] NestJS scaffold + MongoDB + Mongoose
- [x] API versioning (`/api/v1`) + response envelope
- [x] Login / JWT authentication
- [x] Public self-registration
- [x] Staff self-registration (extended form + profile image)
- [x] Admin user management (CRUD, activate/deactivate)
- [x] Staff profiles (list, view, self-update)
- [x] Minimal media upload (profile images)
- [x] Admin seeder script
- [x] `.uploads/` directory (gitignored, publicly served)

### Phase 2+ — Content (later)

- [ ] Admin CRUD for posts
- [ ] Book flow: chapters (including episodic release), fictional characters
- [ ] Flexible ordered content blocks (text, image, video)
- [ ] Cast request workflow (send, accept, decline)
- [ ] Publish / unpublish / delete drafts (Admin only)
- [ ] Per-post and default visibility settings
- [ ] NSFW gating for adult-tagged posts
- [ ] Full post media upload with limit validation
- [ ] Read APIs for Staff and Public (and anonymous where allowed)

### Out of scope (v1)

See [Deferred Features](#deferred-features).

---

## Deferred Features

| Feature | Notes |
|---------|-------|
| **Movies module** | Use generic video content blocks instead |
| **Photoshoot module** | Use generic image content blocks instead |
| **Likes / reactions** | Including thumbs up |
| **Ratings** | Stars (1–5) |
| **Comments & threaded replies** | |
| **Moderation queue** | Not needed |
| **Scheduled publish** | Not needed |
| **Dynamic RBAC** | Hardcoded roles for now |
| **JWT refresh tokens** | Access token only in v1 |
| **Rate limiting** | Handled by separate app |
| **Private / signed upload URLs** | Public `.uploads/` for now |
| **Cast requests from non-admin** | Only Admin sends requests for now |

---

## Domain Model

```
User
 ├── email, username (unique)
 ├── profilePicture?: FileMeta
 ├── role: ADMIN | STAFF | PUBLIC
 ├── isActive, nsfwEnabled
 ├── defaultVisibility (optional)
 └── StaffProfile? (when role === STAFF)

Post
 ├── status: DRAFT | PUBLISHED | UNPUBLISHED | DELETED
 ├── visibility, isAdult
 ├── ContentBlock[] (ordered: TEXT | IMAGE | VIDEO)
 ├── Chapter[] (ordered, can be added after publish)
 └── Character[] (fictional)
      └── CastAssignment → User (STAFF)
           status: PENDING | ACCEPTED | DECLINED | REVOKED
```

### Entity relationships

```mermaid
erDiagram
    User ||--o| StaffProfile : "has when STAFF"
    User {
        string email
        string username
        string role
        boolean isActive
    }

    StaffProfile {
        boolean isProfileComplete
    }

    Post ||--o{ ContentBlock : contains
    Post ||--o{ Chapter : contains
    Post ||--o{ Character : has

    Character ||--o{ CastAssignment : "cast via"
    User ||--o{ CastAssignment : "staff performs"

    Post {
        string status
        string visibility
        boolean isAdult
    }

    Chapter {
        string title
        int sortOrder
    }

    CastAssignment {
        string status
    }
```

### Post lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> DRAFT : edit / add casts / add chapters
    DRAFT --> PUBLISHED : admin publishes
    PUBLISHED --> PUBLISHED : admin adds chapters
    PUBLISHED --> UNPUBLISHED : admin unpublishes
    UNPUBLISHED --> PUBLISHED : admin re-publishes
    DRAFT --> DELETED : admin deletes
    UNPUBLISHED --> DELETED : admin deletes
```

---

## NestJS Module Map

```
src/
├── main.ts
├── app.module.ts
├── config/
├── common/
│   ├── decorators/     # @Roles, @CurrentUser, @Public, @RequirePermission
│   ├── guards/         # JwtAuthGuard, RolesGuard, PermissionsGuard
│   ├── interceptors/   # Response envelope
│   ├── filters/        # Error envelope
│   ├── enums/
│   └── constants/      # permissions.ts
├── auth/
├── users/
├── staff/
├── media/              # upload + static serve
├── posts/              # Phase 2
├── content-blocks/     # Phase 2
├── chapters/           # Phase 2
├── characters/         # Phase 2
├── casting/            # Phase 2
└── access/             # Phase 2 — visibility + NSFW policy
```

---

## API Surface (High Level)

All routes prefixed with `/api/v1`. See [AUTH.md](./AUTH.md) for Phase 1 detail.

### Auth & users (Phase 1)

| Method | Endpoint | Access |
|--------|----------|--------|
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/register/staff` | Public |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | JWT |
| `GET` | `/users` | Admin |
| `POST` | `/users` | Admin |
| `PATCH` | `/users/:id` | Admin |
| `PATCH` | `/users/:id/activate` | Admin |
| `PATCH` | `/users/:id/deactivate` | Admin |
| `PATCH` | `/users/me` | JWT (self) |
| `GET` | `/staff` | Public / authenticated |
| `GET` | `/staff/:id` | Public |
| `PATCH` | `/staff/me` | Staff |
| `POST` | `/media/upload` | Authenticated |
| `GET` | `/health` | Public |

### Posts & content (Phase 2+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/posts` | Create draft (admin) |
| `PATCH` | `/posts/:id` | Update post |
| `DELETE` | `/posts/:id` | Delete draft |
| `POST` | `/posts/:id/publish` | Publish |
| `POST` | `/posts/:id/unpublish` | Unpublish |
| `PATCH` | `/posts/:id/visibility` | Set visibility |
| `GET` | `/posts` | List published |
| `GET` | `/posts/:id` | Single post |
| `POST` | `/posts/:id/chapters` | Add chapter (incl. after publish) |
| `POST` | `/posts/:id/characters` | Add character |
| `POST` | `/posts/:id/characters/:charId/cast-requests` | Admin sends cast request |
| `GET` | `/cast-requests` | Staff: mine; Admin: all |
| `POST` | `/cast-requests/:id/accept` | Staff accepts |
| `POST` | `/cast-requests/:id/decline` | Staff declines |

---

## Build Order

### Phase 1 — Auth foundation

1. Project scaffold — NestJS, Mongoose, env config, health check
2. Global API prefix, response interceptor, exception filter
3. Users schema + StaffProfile schema
4. Auth module — register, register/staff, login, me, JWT guards
5. Users module — admin CRUD, activate/deactivate, self profile
6. Staff module — list, view, self-update
7. Media module — profile upload, static `.uploads/` serve
8. Admin seeder script
9. Documentation (this file, AUTH.md, SETUP.md)

### Phase 2 — Content

1. Posts — draft CRUD, visibility, publish rules
2. Chapters — including post-publish chapter addition
3. Characters + casting workflow
4. Content blocks + full media limits
5. Read APIs with access policy + NSFW gating

---

## Open Decisions

| # | Question | Status | Notes |
|---|----------|--------|-------|
| 1 | **Chapters vs blocks** | Open | Are blocks nested under chapters, or at post level with chapters as metadata? |
| 2 | **Declined cast** | Open | Block publish until recast, or allow character without cast? |
| 3 | **Staff self-register approval** | Resolved | Immediate `STAFF` + `isActive: true` |
| 4 | **Admin-created staff image** | Open | Required at creation vs optional until profile complete |
| 5 | **Soft delete posts** | Open | Prefer soft delete for audit trail |
| 6 | **Username format** | Open | Allowed characters; login via username or email only? |

### Resolved

| Question | Decision |
|----------|----------|
| Database / ODM | MongoDB + Mongoose |
| Registration | Public self-register; staff self-register; admin can create users |
| Roles | `ADMIN`, `STAFF`, `PUBLIC` — hardcoded permissions |
| Auth token | JWT bearer access token only |
| Account control | Admin activate/deactivate; unique email |
| API shape | `{ success, data, meta? }` |
| API versioning | `/api/v1` from start |
| Uploads access | Public for now |
| Rate limiting | Separate app |
| Admin bootstrap | Manual seeder script |

---

## Postman Collections

Importable Postman files live in [`postman/`](../postman/):

| File | Purpose |
|------|---------|
| `My-Verse-API.postman_collection.json` | All Phase 1 API requests |
| `My-Verse-Local.postman_environment.json` | Local dev variables (`baseUrl`, `accessToken`, etc.) |

See [`postman/README.md`](../postman/README.md) for import steps and maintenance rules.

**Keep the collection in sync** with the API whenever endpoints are added or changed.

---

## Document History

| Date | Change |
|------|--------|
| 2026-06-29 | Initial plan — product vision, MVP scope, domain model |
| 2026-06-29 | Stack → MongoDB/Mongoose; auth flows; API conventions; episodic chapters; Phase 1 scope |
| 2026-06-29 | Phase 1 auth foundation implemented |
| 2026-06-29 | Added Postman collection and local environment |
| 2026-06-29 | FileMeta profile picture flow; REGISTRATION.md field specs |
