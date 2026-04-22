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

Reminder scheduler (backend):

- Runs in-process with the backend server.
- Logs daily digest counts for non-done tasks:
  - due today
  - overdue
- Current notifier is console-based and can be replaced later with email/push without changing API endpoints.

Environment variables:

- `REMINDER_INTERVAL_MS` (optional, default `86400000`)
- `REMINDER_RUN_ON_START` (optional, `true`/`false`, default `true`)

Run one reminder sweep manually:

```bash
npm run reminders:run-once --workspace backend
```

## MVP release checklist (manual QA)

Run the backend and frontend locally, then verify each item. The browser developer console and the backend terminal should show no unexpected errors during these flows.

- **Auth**: Sign up a new user, log out, log in again, refresh the app and confirm you stay signed in (`/me` restores the session).
- **Task CRUD (All Tasks)**: Create a task with title and optional due date; edit fields; mark complete; delete a task.
- **Prioritization**: On All Tasks, create tasks with different priority, due date, and effort when supported; open **Today** and confirm the list order matches smart ranking (higher impact / urgency tends to sort higher).
- **Today view**: Start a `todo` task, complete a task, snooze (due date moves forward), and confirm the list refreshes after each action.

## Deployment / staging environment variables

| Variable | Where | Required | Description |
|----------|--------|----------|-------------|
| `JWT_SECRET` | Backend | Yes | At least 16 characters; signs auth tokens. |
| `NODE_ENV` | Backend | No | `development` (default), `test`, or `production`. |
| `PORT` | Backend | No | Listen port (default `4000`). |
| `REMINDER_INTERVAL_MS` | Backend | No | Milliseconds between reminder sweeps (default one day; minimum `60000`). |
| `REMINDER_RUN_ON_START` | Backend | No | `true` or `false` (default `true`). |
| `CORS_ORIGIN` | Backend | No | Exact browser origin for the UI (e.g. `https://app.example.com`). Set when the frontend and API are on **different** origins so the browser may call the API. Omit for same-origin setups (reverse proxy serving both). |
| `VITE_API_BASE_URL` | Frontend build | No | Public base URL of the API (no trailing slash), e.g. `https://api.example.com`. Defaults to `http://localhost:4000` for local dev. Must be set at **build** time for production/staging static assets. |

Apply database migrations before or on startup of a new environment:

```bash
npm run db:migrate:up --workspace backend
```

### Production-style run (example)

Backend (from repo root; run migrations first as above):

```bash
set NODE_ENV=production
set JWT_SECRET=your_long_random_secret_here
npm run build --workspace backend
npm run start --workspace backend
```

Frontend (point `VITE_API_BASE_URL` at your deployed API):

```bash
set VITE_API_BASE_URL=https://your-api-host.example.com
npm run build --workspace frontend
```

Serve the contents of `frontend/dist` with your static host or CDN. If the UI and API share one domain via a reverse proxy, you can omit `CORS_ORIGIN`; otherwise set `CORS_ORIGIN` to the UI origin and build the frontend with matching `VITE_API_BASE_URL`.
