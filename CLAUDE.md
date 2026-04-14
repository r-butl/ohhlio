# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Ohhlio is a full-stack portfolio creation platform. Users register, build drag-and-drop grid-based portfolios with text and image items, and share them publicly via their username URL.

## Commands

### Frontend (`frontend/`)
```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm test          # Vitest
npm run test:ui   # Vitest with UI
```

### Backend (`backend/`)
```bash
npm run dev           # ts-node-dev with hot reload
npm run build         # TypeScript compile to dist/
npm test              # Jest
npm run test:watch    # Jest watch mode
npm run test:coverage # Coverage report

# Database (Prisma)
npm run db:migrate    # Run migrations
npm run db:push       # Sync schema without migration
npm run db:generate   # Regenerate Prisma client
npm run db:view       # Prisma Studio GUI
```

### Full Stack
```bash
docker-compose up     # Start PostgreSQL + backend + frontend together
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router 7, Radix UI, @dnd-kit, react-grid-layout, Tiptap (rich text)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, Multer, AWS S3
- **Testing**: Vitest (frontend), Jest (backend)

### URL Structure
```
/                           → Login/Register page
/:username                  → Public profile overview
/:username/project          → Project editor (new project)
/:username/project/:id      → Project editor (existing)
```

### Frontend State

Three separate state stores that work together:

1. **`AuthContext`** — JWT token + user identity. Stores token in localStorage. Emits `forceLogout` window event when the backend rejects a token (401/403), which triggers logout from anywhere in the app.

2. **`UserContext`** — Current user's profile data (username, avatar, description). Caches avatar URL and description in localStorage.

3. **`EditorStore`** (Zustand + Immer) — All editor state: the active project, grid layout, items (text/image), undo/redo history (20-item limit), asset cache, project list, and view mode. View mode is a state machine with three states: `PublicView`, `OwnerEdit`, `OwnerPreview`.

### Backend Structure

```
backend/src/
  controllers/   # authController, userController, projectController, assetController
  routes/        # mounted under /api/{auth,users,profile,projects,assets,health}
  middleware/    # authMiddleware — protect() validates Bearer tokens
  prisma/        # schema.prisma, migrations/
```

### Database Schema (Prisma)

- **User** — id, email (unique), username (unique), password (hashed), description, profileImageId → Asset
- **Project** — id, title, description, isPublic, userId → User, items (JSON), headerPhotoId → Asset
- **Asset** — id, filename, filePath, mimeType, fileSize, type, userId, projectId

Project content (grid items) is stored as JSON in the `items` column — not a separate table.

### API Service Layer

Frontend services in `src/services/` handle all API communication:
- `authService.ts` — login/register, token expiration detection
- `projectService.ts` — project CRUD
- `userService.ts` — profile operations
- `assetService.ts` — file upload/download

The API base URL is built via a utility that reads `VITE_API_URL`.

### Asset Storage

Files are served from a local `UPLOAD_DIR` in development. The backend is wired for AWS S3 in production (S3 SDK is present). The `assetService.ts` on the frontend handles upload, download, and caching of blobs.

### Path Aliases

Frontend uses `@/` mapped to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
