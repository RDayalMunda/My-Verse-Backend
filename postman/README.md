# My Verse — Postman Collections

Postman import files for the My Verse backend API.

## Files

| File | Description |
|------|-------------|
| [My-Verse-API.postman_collection.json](./My-Verse-API.postman_collection.json) | All API requests, grouped by module |
| [My-Verse-Local.postman_environment.json](./My-Verse-Local.postman_environment.json) | Local dev variables (`baseUrl`, tokens, IDs) |

## Import

1. Open Postman
2. **Import** → select both JSON files in this directory
3. Select the **My Verse — Local** environment in the top-right dropdown
4. Run **Media → Upload Profile Image** (sets `profilePictureMeta`)
5. Run **Auth → Register** or **Register (Staff)** (uses `profilePictureMeta` in JSON body)
6. Run **Auth → Login (Admin)** for admin routes

## Variables

| Variable | Description |
|----------|-------------|
| `baseUrl` | API base URL (default `http://localhost:3000/api/v1`) |
| `accessToken` | JWT bearer token (set by login/register requests) |
| `profilePictureMeta` | JSON string of FileMeta from upload (used in register/update bodies) |
| `userId` | Last logged-in or created user ID |
| `staffProfileId` | Staff profile ID (set from staff list/register) |
| `adminEmail` | Admin login email (matches `.env`) |
| `adminPassword` | Admin login password (matches `.env`) |
| `projectId` | Last created project ID |
| `sectionId` | Last created section ID |
| `sectionItemId` | Last created section item ID |
| `projectImageMeta` | FileMeta from project image upload |
| `projectVideoMeta` | FileMeta from project video upload |

## Registration flow in Postman

```
Media → Upload Profile Image     → sets profilePictureMeta
Auth  → Register (Public)        → optional profilePicture: {{profilePictureMeta}}
Auth  → Register (Staff)        → required profilePicture: {{profilePictureMeta}}
Users → Update Me               → optional profilePicture: {{profilePictureMeta}}
```

## Project flow in Postman (Phase 2)

```
Auth → Login (Admin)              → sets accessToken
Projects → Create Book            → sets projectId
Sections → Create Section         → sets sectionId
Section Items → Add Text Item     → sets sectionItemId
Sections → Publish Section
Projects → Publish Project
Projects → Get Project (no auth)  → public read with published sections
```

For PHOTOSHOOT: **Media → Upload Project Image** → **Add Image Item**  
For SHOW: **Media → Upload Project Video** → **Add Video Item**

Render images in the frontend with: `{origin}{fileMeta.url}` (e.g. `http://localhost:3000/uploads/images/...`).

See [docs/REGISTRATION.md](../docs/REGISTRATION.md) (staff body fields), [docs/PROJECTS.md](../docs/PROJECTS.md), and [docs/CONTENT_CREATION_GUIDE.md](../docs/CONTENT_CREATION_GUIDE.md) for full field specifications.

## Maintenance

**Update this collection whenever you add or change an API endpoint.**

1. Edit the collection in Postman, or update the JSON file directly
2. Match request paths, bodies, and auth to [docs/PROJECTS.md](../docs/PROJECTS.md), [docs/REGISTRATION.md](../docs/REGISTRATION.md), [docs/AUTH.md](../docs/AUTH.md), and [docs/PROJECT_PLAN.md](../docs/PROJECT_PLAN.md)
3. Export and replace `My-Verse-API.postman_collection.json` if edited in Postman
