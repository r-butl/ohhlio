# SEO: robots.txt, sitemap.xml, and Server-Side Meta Injection

**Date:** 2026-06-04  
**Scope:** Backend meta tag injection, robots.txt, sitemap.xml

---

## Goal

Make Ohhlio pages indexable by search engines and produce rich link previews when shared on social media or messaging apps. This covers all public-facing routes: the homepage/login, user profile pages (`/:username`), and project pages (`/:username/project/:id`).

---

## Architecture

The Express backend takes over serving the frontend in addition to the API. Netlify's frontend deployment is removed — the frontend is built and bundled into the backend Docker image. The Netlify site either points its domain to the backend server or is decommissioned entirely.

```
Request
  ├── /api/*                    → existing API handlers (unchanged)
  ├── /robots.txt               → static response
  ├── /sitemap.xml              → dynamic DB query response
  ├── /:username                → meta-injected index.html
  ├── /:username/project/:id    → meta-injected index.html
  └── everything else           → static files from dist/, fallback to index.html
```

The built `frontend/dist/` directory is copied into the backend container (or mounted) and served via `express.static`. The `index.html` is read once at startup and cached as a string template.

---

## robots.txt

Served as a static Express route at `/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://ohhlio.com/sitemap.xml
```

---

## sitemap.xml

A dynamic Express route at `/sitemap.xml` that queries the DB via Prisma for:
- All users → generates `/:username` entries
- All public projects → generates `/:username/project/:id` entries

Returns a standard XML sitemap with `<loc>` and `<lastmod>` fields. No caching needed initially — can be added later if the query becomes slow.

---

## Meta Tag Injection

### Mechanism

`index.html` gets a placeholder comment added:

```html
<head>
  <!-- META_TAGS -->
  ...
</head>
```

At request time, Express replaces `<!-- META_TAGS -->` with a generated block of `<meta>` and `<title>` tags before sending the response.

### Per-route logic

**`/:username`**
- Queries DB for user by username
- If found:
  - `<title>username | Ohhlio</title>`
  - `<meta name="description" content="user.description if set, otherwise 'View username's portfolio on Ohhlio.'">`
  - `og:title`, `og:description`, `og:url`
  - `og:image` — if user has a `profileImageId`, generate a signed S3 URL via `getSignedDownloadUrl`
- If not found: falls back to generic tags (React app handles 404 display)

**`/:username/project/:id`**
- Queries DB for project by id, verifies it belongs to username
- If found and public:
  - `<title>project title | username | Ohhlio</title>`
  - `<meta name="description" content="project.description if set, otherwise 'A project by username on Ohhlio.'">`
  - `og:title`, `og:description`, `og:url`
  - `og:image` — if project has a `headerPhotoId`, generate a signed S3 URL
- If not found or private: falls back to generic tags

**All other routes** (login, `/`, unknown paths)
- Generic tags:
  - `<title>Ohhlio</title>`
  - `<meta name="description" content="Build and share your portfolio with Ohhlio.">`
  - Basic `og:title` and `og:description`

### S3 signed URLs for og:image

Assets are stored in S3 with expiring signed URLs. The meta injection middleware calls `getSignedDownloadUrl(asset.filePath)` at request time to generate a fresh URL. Signed URL expiry (typically 1 hour) is acceptable for crawler use — crawlers fetch the image immediately.

---

## Implementation Notes

- A new `metaMiddleware.ts` file handles the injection logic for `/:username` and `/:username/project/:id` routes
- A new `sitemapController.ts` generates the sitemap XML
- `server.ts` (or `app.ts`) registers: robots route, sitemap route, static file serving, meta middleware, and the catch-all fallback
- The `index.html` placeholder `<!-- META_TAGS -->` is added manually before building the frontend

---

## Out of Scope

- `react-helmet-async` for client-side title updates (no SEO benefit)
- Sitemap caching or incremental updates
- Structured data / JSON-LD
- A landing page (to be done separately when built)
