# file-uploader

This repository implements a simple file uploader backend with session-based authentication, file storage, and folder organization. The frontend is served from the `public/` directory. This README summarizes only the backend implementation, design decisions, and how to run it locally.

## Quick overview

- Node.js + Express (TypeScript)
- Prisma ORM with PostgreSQL (see `prisma/schema.prisma`)
- Authentication with `passport-local` and `express-session`
- File uploads handled by `multer` to the `uploads/` folder
- Routes are mounted under `/auth` and `/api`

## API Endpoints (backend)

Authentication

- POST `/auth/signup` — Create account. Body: `{ username, password, email }`. Returns 201 on success.
- POST `/auth/login` — Login with `{ username, password }`. Uses Passport local strategy and stores session cookie.
- POST `/auth/logout` — Logs out the current session.
- GET `/auth/me` — Returns the current logged-in user object or `401` if not authenticated.

Files

- POST `/api/upload` — Upload a single file. Form-data field: `file`. Requires auth. Saves file on disk and metadata to DB.
- GET `/api/files` — Returns list of files owned by the authenticated user.
- GET `/api/files/:fileId/download` — Initiates a file download (serves the saved file).
- DELETE `/api/files/:fileId` — Deletes a file (DB record and file on disk as implemented in routes).
- PATCH `/api/files/:fileId/move` — Move a file into a folder. Body: `{ folderId }`.

Folders

- POST `/api/folders` — Create a new folder. Body: `{ name }`.
- GET `/api/folders` — Returns folders for user, each with included files.

All `/api` and `/auth/me` endpoints require the user to be authenticated (session cookie). Requests must include credentials when called from a browser: `fetch(..., { credentials: include })`.

## Data model (Prisma)

See `prisma/schema.prisma`. Key models:

- `User` — id, username (unique), password (hashed), email (unique), relations to `files` and `folders`.
- `File` — id, name, size (stored as string), path (disk path), `userId`, optional `folderId`.
- `Folder` — id, name, `userId`, relation to `files`.

Prisma client is used directly inside route handlers to perform CRUD operations.

## Authentication & Session

- Passport local strategy (`src/config/passport.ts`) authenticates users by username and password. Passwords are hashed with `bcryptjs`.
- `express-session` is configured in `src/index.ts` (development uses a hard-coded secret — change this in production). Sessions are persisted in-memory by default (consider a store like Redis for production).
- Passport `serializeUser` stores the user id in the session and `deserializeUser` loads the user record for each request.

## File uploads

- `multer` is configured in `src/config/multer.ts` to store uploaded files on disk (`uploads/`), with a generated filename (`Date.now()-originalname`).
- File filter restricts uploads to common documents/images (`jpeg|jpg|png|gif|pdf|txt|doc|docx`).
- File size limit is set to 5MB in the multer config (adjust `limits.fileSize` for your needs).

## Important implementation notes

- Routes enforce authentication with a small middleware `requireAuth` that checks `req.user` and returns `401` if missing.
- File metadata is stored in the database when an upload succeeds. The `path` field references the path on disk where multer saved the file.
- Folder endpoints include files when returning folder objects (`include: { files: true }`).
- Error handling: most routes wrap logic in try/catch and return `4xx`/`5xx` with `error` messages.

## Environment variables

Create a `.env` in the project root with at least:

- `DATABASE_URL` — PostgreSQL connection string used by Prisma
- `SESSION_SECRET` — secret for `express-session` (replace the hard-coded secret in production)

Example `.env` (development):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/fileuploader
SESSION_SECRET=replace_this_with_a_secure_value
```

## Running locally

1. Install dependencies

```bash
npm install
```

2. Prepare the database and Prisma client

```bash
npx prisma migrate dev --name init
npx prisma generate
```

3. Start the dev server

```bash
npm run dev
```

Server will be available at `http://localhost:3000`. The `public/` folder is served statically (so `http://localhost:3000/index.html` loads the frontend).

## Security & production notes

- Use a persistent session store (Redis, Memcached) instead of the default memory store.
- Set `cookie.secure = true` and `sameSite` appropriately when serving over HTTPS.
- Never keep secrets (`SESSION_SECRET`, DB credentials) in source control; use environment variables and a secrets manager.
- Validate and sanitize user inputs carefully if you extend features (e.g., folder names, file metadata).
- Consider rate limiting and upload virus scanning for uploaded files.
