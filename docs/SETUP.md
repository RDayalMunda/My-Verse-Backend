# My Verse — Local Setup

> How to run the My Verse backend locally.  
> See also: [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [AUTH.md](./AUTH.md) · [REGISTRATION.md](./REGISTRATION.md) · [PROJECTS.md](./PROJECTS.md) · [CONTENT_CREATION_GUIDE.md](./CONTENT_CREATION_GUIDE.md) · [Postman](../postman/README.md)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS (recommended) |
| npm | 10+ |
| MongoDB | 6+ (local or Atlas) |

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd My-Verse-Backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start MongoDB (if local)
# mongod — or use Docker / Atlas URI in .env

# 4. Seed the admin account (required before first use)
npm run seed:admin

# 5. Start the dev server
npm run start:dev
```

Server runs at `http://localhost:3000` (or `PORT` from `.env`).

API base: `http://localhost:3000/api/v1`

---

## Postman

Import the API collection and local environment from [`postman/`](../postman/):

1. Import `postman/My-Verse-API.postman_collection.json`
2. Import `postman/My-Verse-Local.postman_environment.json`
3. Select **My Verse — Local** environment
4. Run **Auth → Login (Admin)** — sets `accessToken` automatically

Update the collection when adding or changing endpoints. See [`postman/README.md`](../postman/README.md).

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/my-verse

# JWT
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Admin seeder (used by npm run seed:admin only)
ADMIN_EMAIL=admin@myverse.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-before-deploy
```

> **Never commit `.env`** — it is gitignored. Commit `.env.example` with placeholder values only.

---

## Admin Seeder

The deployment team runs the seeder **manually before the application is first used**. It does not run automatically on app start.

```bash
npm run seed:admin
```

**Behavior:**

- Reads `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` from `.env`
- Creates an admin user **only if no user with role `ADMIN` exists**
- Exits with an error if admin already exists (safe to re-run — it will skip or warn)

**After seeding**, log in:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myverse.local","password":"change-me-before-deploy"}'
```

---

## Uploads & Media Storage

**Images** (profile + project) are stored in MongoDB as BSON Binary in the `media` collection.

| Endpoint | Returns |
|----------|---------|
| `GET /api/v1/media/images/:id` | Raw image bytes (`Content-Type: image/*`) — use in `<img src="{origin}{url}">` |
| `GET /api/v1/media/images/:id?format=json` | JSON envelope with `base64` / `dataUri` (optional; not for `<img src>`) |

See [REGISTRATION.md](./REGISTRATION.md#rendering-images-in-the-frontend) for frontend examples.

**Videos** are stored on disk in `.uploads/videos/`:

```
.uploads/
└── videos/      # project videos only
```

- **Gitignored** — not committed to the repository
- Videos **publicly served** at `/uploads/videos/<path>`
- Video directory created automatically on app bootstrap

---

## Example API Calls

See [REGISTRATION.md](./REGISTRATION.md) for full field specs. Typical registration flow:

### 1. Upload profile picture

```bash
curl -X POST http://localhost:3000/api/v1/media/upload \
  -F "file=@./photo.jpg"
```

Save the `data` object from the response as `profilePicture`.

### 2. Register as public user

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securePass123",
    "displayName": "John Doe",
    "profilePicture": {
      "mediaId": "your-media-id",
      "url": "/api/v1/media/images/your-media-id",
      "mimeType": "image/jpeg",
      "size": 245760,
      "uploadedAt": "2026-06-29T12:00:00.000Z"
    }
  }'
```

`profilePicture` is optional for public users.

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securePass123"}'
```

### Get current user

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Register as staff

```bash
curl -X POST http://localhost:3000/api/v1/auth/register/staff \
  -H "Content-Type: application/json" \
  -d '{
    "email": "performer@example.com",
    "username": "star_performer",
    "password": "securePass123",
    "displayName": "Star Performer",
    "profilePicture": { "...FileMeta from upload..." },
    "stageName": "Star",
    "bio": "Professional performer"
  }'
```

### Health check

```bash
curl http://localhost:3000/api/v1/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

---

## Example: Project flow (Phase 2)

See [PROJECTS.md](./PROJECTS.md) for the full API reference.

### 1. Login as admin

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myverse.local","password":"change-me-before-deploy"}'
```

Save `data.accessToken` as `$TOKEN`.

### 2. Create a book project

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"BOOK","title":"My First Book","bookDetails":{"summary":"A tale."}}'
```

### 3. Add section and text item

```bash
# Replace PROJECT_ID and SECTION_ID from responses
curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/sections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Chapter 1"}'

curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/sections/SECTION_ID/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"TEXT","textContent":"Once upon a time..."}'
```

### 4. Publish section, then project

```bash
curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/sections/SECTION_ID/publish \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/api/v1/projects/PROJECT_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Public read

```bash
curl http://localhost:3000/api/v1/projects/PROJECT_ID
```

### Upload project image (for PHOTOSHOOT)

```bash
curl -X POST http://localhost:3000/api/v1/media/upload/image \
  -F "file=@./photo.jpg"
```

Use the returned `data` object as `file` when creating an IMAGE section item.

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start production build |
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run seed:admin` | Create initial admin user |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |

---

## Deployment Checklist

1. Set production `MONGODB_URI` (Atlas or managed MongoDB)
2. Set a strong `JWT_SECRET` (32+ random characters)
3. Set secure `ADMIN_PASSWORD` and run `npm run seed:admin`
4. Configure `CORS_ORIGINS` for your web/mobile clients
5. Ensure `.uploads/` directory exists and is writable
6. Ensure `.uploads/` is **not** committed to git
7. Place rate limiting / WAF in front of the API (separate service)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `MongoServerError: connect ECONNREFUSED` | Start MongoDB or check `MONGODB_URI` |
| `401 Unauthorized` on protected routes | Check `Authorization: Bearer <token>` header |
| `403 Account deactivated` | Admin must activate the account |
| `409 Conflict` on register | Email or username already taken |
| Upload fails | Check file size (≤ 5 MB for profiles) and MIME type |

---

## Document History

| Date | Change |
|------|--------|
| 2026-06-29 | Initial setup guide |
| 2026-06-29 | Added Postman import section |
| 2026-06-29 | FileMeta upload flow; REGISTRATION.md |
| 2026-06-29 | Phase 2 project flow examples; PROJECTS.md |
