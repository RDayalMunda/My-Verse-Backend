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
4. Run **Auth → Login (Admin)** to set `accessToken` automatically

## Variables

| Variable | Description |
|----------|-------------|
| `baseUrl` | API base URL (default `http://localhost:3000/api/v1`) |
| `accessToken` | JWT bearer token (set by login/register requests) |
| `userId` | Last logged-in or created user ID |
| `staffProfileId` | Staff profile ID (set from staff list/register) |
| `adminEmail` | Admin login email (matches `.env`) |
| `adminPassword` | Admin login password (matches `.env`) |

## Maintenance

**Update this collection whenever you add or change an API endpoint.**

1. Edit the collection in Postman, or update the JSON file directly
2. Match request paths, bodies, and auth to [`docs/AUTH.md`](../docs/AUTH.md) and [`docs/PROJECT_PLAN.md`](../docs/PROJECT_PLAN.md)
3. Export and replace `My-Verse-API.postman_collection.json` if edited in Postman

Phase 2 endpoints (posts, chapters, casting, etc.) will be added to this collection as they are implemented.
