# My Verse — Authentication & Users

> Phase 1 specification for auth, users, staff profiles, and permissions.  
> See also: [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [SETUP.md](./SETUP.md) · [REGISTRATION.md](./REGISTRATION.md) · [Postman](../postman/README.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Roles & Permissions](#roles--permissions)
3. [Data Models](#data-models)
4. [Registration Flows](#registration-flows)
5. [Authentication](#authentication)
6. [API Endpoints](#api-endpoints)
7. [Guards & Decorators](#guards--decorators)
8. [Environment Variables](#environment-variables)
9. [Security Notes](#security-notes)

---

## Overview

All actors — Admin, Staff, and Public — are **`User` documents** in MongoDB. Role determines capabilities. Staff users have an additional **`StaffProfile`** collection for extended performer data.

| Principle | Detail |
|-----------|--------|
| Identity | Single `users` collection |
| Auth | JWT bearer token returned by login |
| Permissions | Hardcoded in `permissions.ts` — not stored in DB |
| Email | Unique, used for login |
| Username | Unique |
| Deactivation | `isActive: false` blocks login; no hard delete in v1 |

---

## Roles & Permissions

### Roles

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  PUBLIC = 'PUBLIC',
}
```

### Permission matrix

| Permission | ADMIN | STAFF | PUBLIC | Description |
|------------|:-----:|:-----:|:------:|-------------|
| `users:manage` | ✓ | — | — | List/create/update/deactivate users |
| `users:read:self` | ✓ | ✓ | ✓ | Read own user record |
| `users:update:self` | ✓ | ✓ | ✓ | Update own base fields |
| `staff:read` | ✓ | ✓ | ✓ | List and view staff profiles |
| `staff:update:self` | ✓ | ✓ | — | Update own staff profile |
| `posts:crud` | ✓ | — | — | Create/edit/delete posts (Phase 2) |
| `posts:publish` | ✓ | — | — | Publish/unpublish posts (Phase 2) |
| `posts:read` | ✓ | ✓ | ✓ | View published posts (Phase 2) |
| `cast:respond` | ✓ | ✓ | — | Accept/decline cast requests (Phase 2) |

**Staff and Public are almost identical** in v1. Differences: Staff has `StaffProfile`, can update it, and will respond to cast requests.

Admin has **all** permissions.

### Enforcement

```typescript
// Coarse — by role
@Roles(UserRole.ADMIN)

// Fine-grained — by permission constant
@RequirePermission('users:manage')
```

`PermissionsGuard` checks the authenticated user's role against `ROLE_PERMISSIONS` in code.

---

## Data Models

### User

```typescript
{
  _id: ObjectId,
  email: string,           // unique, indexed
  username: string,        // unique, indexed
  passwordHash: string,    // bcrypt; never returned in API
  displayName?: string,
  profilePicture?: FileMeta,  // optional for PUBLIC; required for STAFF register
  role: 'ADMIN' | 'STAFF' | 'PUBLIC',
  isActive: boolean,       // default true
  nsfwEnabled: boolean,    // default false
  defaultVisibility?: 'PUBLIC' | 'AUTHENTICATED' | 'STAFF_ONLY' | 'PRIVATE',
  createdAt: Date,
  updatedAt: Date,
}
```

**Indexes:** `email` (unique), `username` (unique), `role`, `isActive`

### ImageFileMeta (embedded on User.profilePicture)

```typescript
{
  mediaId: ObjectId,
  url: string,        // e.g. /api/v1/media/images/{mediaId}
  mimeType: string,   // image/jpeg | image/png | image/webp
  size: number,       // bytes, max 5MB
  uploadedAt: Date,
}
```

See [REGISTRATION.md](./REGISTRATION.md) for upload flow and field specs.

### StaffProfile

Only exists when `User.role === 'STAFF'`. One profile per staff user.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // ref User, unique
  stageName?: string,
  bio?: string,
  dateOfBirth?: Date,
  location?: string,
  skills?: string[],
  socialLinks?: {
    platform: string,
    url: string,
  }[],
  gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_DISCLOSE',
  heightCm: number,        // centimeters
  weightG: number,         // grams
  likes: string[],
  // Female-only (when gender === FEMALE)
  chestCm?: number,
  waistCm?: number,
  hipsCm?: number,
  cupSize?: string,        // 1 to 4 characters
  // Male-only (when gender === MALE)
  lengthLimpMm?: number,
  lengthErectMm?: number,
  girthMm?: number,
  loadCapacityMl?: number,
  isProfileComplete: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

Profile photo is stored on **`User.profilePicture`** (FileMeta), not on StaffProfile.

**Indexes:** `userId` (unique)

> `isProfileComplete` is `true` when the user has `profilePicture`, plus `stageName`, `bio`, and all required body fields for the selected `gender`. See [REGISTRATION.md](./REGISTRATION.md).

### User API shape (safe — no password)

```typescript
{
  id: string,
  email: string,
  username: string,
  displayName?: string,
  profilePicture?: FileMeta,
  role: UserRole,
  isActive: boolean,
  nsfwEnabled: boolean,
  defaultVisibility?: string,
  staffProfile?: StaffProfile,
  createdAt: string,
  updatedAt: string,
}
```

---

## Registration Flows

Full field tables and examples: **[REGISTRATION.md](./REGISTRATION.md)**

### Upload first (profile picture)

```
POST /api/v1/media/upload   (public, multipart file)
→ FileMeta in response.data
```

### Path A — Public registration

```
POST /api/v1/auth/register   (JSON)
```

Optional `profilePicture: FileMeta`. Creates `PUBLIC` user. Returns JWT.

### Path B — Staff self-registration

```
POST /api/v1/auth/register/staff   (JSON)
```

Required `profilePicture: FileMeta` plus staff fields (`stageName`, `bio`, etc.). Creates `STAFF` user + StaffProfile. Returns JWT.

### Path C — Admin creates user

```
POST /api/v1/users   (admin JWT)
```

`profilePicture` required for STAFF; optional for PUBLIC. Staff also requires `staffProfile` object.

---

## Authentication

### Login

```
POST /api/v1/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "PUBLIC",
      "isActive": true
    }
  }
}
```

**Failure cases:**

| Condition | HTTP | Message |
|-----------|------|---------|
| Wrong email/password | 401 | Invalid credentials |
| `isActive: false` | 403 | Account deactivated |

### JWT payload

```typescript
{
  sub: string,      // userId
  email: string,
  role: UserRole,
  iat: number,
  exp: number,
}
```

### Using the token

```
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

Returns full user object (+ `staffProfile` if STAFF).

### Token lifetime

Configured via `JWT_EXPIRES_IN` env var (e.g. `7d`). No refresh token in v1.

---

## API Endpoints

All routes under `/api/v1`. Response envelope documented in [PROJECT_PLAN.md](./PROJECT_PLAN.md#api-conventions).

Import ready-made requests from [`postman/My-Verse-API.postman_collection.json`](../postman/My-Verse-API.postman_collection.json).

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register as PUBLIC |
| `POST` | `/auth/register/staff` | Public | Register as STAFF + profile |
| `POST` | `/auth/login` | Public | Login, returns JWT |
| `GET` | `/auth/me` | JWT | Current user |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users` | Admin | List all users (paginated: `?page=1&perPage=20`) |
| `POST` | `/users` | Admin | Create user |
| `PATCH` | `/users/:id` | Admin | Update user (role, fields) |
| `PATCH` | `/users/:id/activate` | Admin | Set `isActive: true` |
| `PATCH` | `/users/:id/deactivate` | Admin | Set `isActive: false` |
| `PATCH` | `/users/me` | JWT | Update own base fields + profilePicture |

**Self-update allowed fields:** `displayName`, `nsfwEnabled`, `defaultVisibility`, `profilePicture` (FileMeta)

### Staff

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/staff` | Public | List staff profiles (complete only; `?page=1&perPage=20`) |
| `GET` | `/staff/:id` | Public | Single staff profile |
| `PATCH` | `/staff/me` | Staff | Update own staff profile |

### Media (images)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/media/upload` | Public | Upload profile image; returns ImageFileMeta |
| `POST` | `/media/upload/image` | Public | Upload project image; returns ImageFileMeta |
| `GET` | `/media/images/:id` | Public | **Binary image** — raw bytes, `Content-Type: image/*`. Bypasses JSON envelope. Use as `<img src>`. |
| `GET` | `/media/images/:id?format=json` | Public | Standard `{ success, data }` JSON with metadata + `base64` / `dataUri` |

**Profile upload limits:** ≤ 5 MB; `image/jpeg`, `image/png`, `image/webp`.

Images are stored in MongoDB (`media` collection) as BSON Binary. Videos remain on disk at `.uploads/videos/` and are served at `/uploads/videos/<filename>`.

Register/update endpoints accept the returned **ImageFileMeta** object as `profilePicture` — not raw file data.

#### Frontend image rendering

```tsx
// profilePicture.url is "/api/v1/media/images/{mediaId}"
<img src={`${API_ORIGIN}${user.profilePicture.url}`} alt="" />
```

- **Default image URL** → binary response, suitable for `<img src>`, `<img srcset>`, CSS `background-image: url(...)`.
- **`?format=json`** → only when you explicitly need `dataUri` / `base64` in JS. Do not use for normal display.

### Pagination (list endpoints)

`GET /users`, `GET /staff`, and `GET /projects` accept query params:

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | `1` | — | Page number (1-based) |
| `perPage` | `20` | `100` | Items per page |

Response `meta`:

```json
{ "page": 1, "perPage": 20, "total": 142, "totalPages": 8 }
```

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | App + MongoDB status |

---

## Guards & Decorators

| Name | Purpose |
|------|---------|
| `@Public()` | Skip JWT authentication |
| `@Roles(...roles)` | Require one of the listed roles |
| `@RequirePermission(...perms)` | Require permission from hardcoded map |
| `@CurrentUser()` | Inject authenticated user into handler param |

**Global guard:** `JwtAuthGuard` applied app-wide; routes marked `@Public()` opt out.

**Order:** `JwtAuthGuard` → `RolesGuard` / `PermissionsGuard`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3000`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token expiry (default `7d`) |
| `ADMIN_EMAIL` | Seeder | Admin email for seed script |
| `ADMIN_USERNAME` | Seeder | Admin username for seed script |
| `ADMIN_PASSWORD` | Seeder | Admin password for seed script |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

See [SETUP.md](./SETUP.md) for full setup instructions.

---

## Security Notes

1. **Passwords** — bcrypt with appropriate cost factor (12+). Never log or return `passwordHash`.
2. **Role injection** — never accept `role: ADMIN` from public endpoints. Validate role on admin-only user creation.
3. **Deactivated accounts** — check `isActive` in login and JWT validation strategy.
4. **Upload validation** — verify MIME type and file size server-side; generate unique filenames.
5. **Public uploads** — `.uploads/` is publicly served in v1. Do not store sensitive files there.
6. **No rate limiting** — handled by external gateway; not this app's responsibility.

---

## Document History

| Date | Change |
|------|--------|
| 2026-06-29 | Initial auth specification — Phase 1 |
| 2026-06-29 | Staff register → multipart single request; staff approval resolved (immediate STAFF) |
| 2026-06-29 | Linked Postman collection for API testing |
| 2026-06-29 | FileMeta upload flow; profilePicture on User; registration field specs in REGISTRATION.md |
