# Smart To-Do MVP

Monorepo scaffold with a TypeScript frontend and backend.

## Apps

- `frontend`: React + Vite + TypeScript
- `backend`: Express + TypeScript

## Prerequisites

- Node.js 20+
- npm 10+

## Install Dependencies

```bash
npm install
```

## Run in Development

Frontend:

```bash
npm run dev --workspace frontend
```

Backend:

```bash
set JWT_SECRET=replace_with_a_long_secret
npm run dev --workspace backend
```

## Lint and Format Checks

Frontend:

```bash
npm run lint --workspace frontend
npm run format --workspace frontend
```

Backend:

```bash
npm run lint --workspace backend
npm run format --workspace backend
```

Or run both apps from the repo root:

```bash
npm run lint
npm run format
```

## Database Migration and Seed (Task 2)

Run from repo root:

```bash
npm run db:migrate:up --workspace backend
npm run db:seed --workspace backend
```

Rollback latest migration:

```bash
npm run db:migrate:down --workspace backend
```

SQLite database path:

- `backend/data/smart_todo.db`

Auth endpoints:

- `POST /auth/signup`
- `POST /auth/login`
- `GET /me` (requires `Authorization: Bearer <token>`)

Task endpoints (all require `Authorization: Bearer <token>`):

- `GET /tasks`
- `GET /tasks/today` (returns non-done tasks sorted by smart score)
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Task fields:

- `status`: `todo | in_progress | done`
- `priority`: `low | medium | high`
- `effort`: `low | medium | high`

Backend tests:

```bash
npm run test --workspace backend
```
