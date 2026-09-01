# Chatboot

A simple, secure 1:1 chat that deploys to **Vercel as a single project**.

- **frontend/** – the whole app: Next.js 16 (App Router) + React 19 + shadcn (base-nova)
  UI, and the API as Next.js Route Handlers (MongoDB via Mongoose) under `/api`
- **backend/** – *legacy* standalone Express 5 + Socket.IO server, kept for reference and
  self-hosting. Not used by the Vercel deployment; safe to delete.

## Features

- Sign up / sign in / sign out — password hashed with bcrypt, session in an httpOnly JWT cookie
- User directory with search (by username or email)
- 1:1 chat with live delivery, typing indicator, read receipts and online presence
- Messages are **encrypted at rest** (AES-256-GCM) — a database dump never exposes plaintext
- Groups & Channels are **blueprints only** — schemas and API routes are reserved (respond `501`)
  and the UI shows disabled entries; nothing is implemented yet

## How realtime works (and why there is no WebSocket)

Vercel Functions are request-scoped: nothing can hold a socket open, so Socket.IO was replaced
by a short poll of `GET /api/sync`. One request per tick carries everything the socket used to
push — new messages, read-receipt flips, presence, and the peer's typing flag — and doubles as
the caller's presence heartbeat.

| Old socket event | Now |
| --- | --- |
| `message:new`, `message:read` | `messages` in the `/api/sync` response (upserts, merged by `_id`) |
| `presence:list` / `:online` / `:offline` | `online` array in the same response |
| `typing` | `typing` boolean in the same response; `POST /api/typing` to publish |
| `message:send` | `POST /api/message` |

The client polls every 2s while the tab is visible and every 15s when it is hidden
(`frontend/lib/realtime.ts`). Presence and typing live in MongoDB as *expiring facts* rather
than in one process' memory, so they stay correct across as many Function instances as Vercel
decides to run — something the old in-memory `online` map never was.

## Running locally

```bash
cd frontend
cp .env.example .env.local   # then fill in MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY
npm install
npm run dev                  # http://localhost:3000
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"        # ENCRYPTION_KEY
```

Leave `NEXT_PUBLIC_API_URL` unset — the client then talks to the same-origin `/api`.

## Deploy to Vercel

1. **New Project** from this repo, then set **Root Directory = `frontend`**.
   This is the only manual step that is easy to miss: the repo root is not the app.
2. Add the environment variables (Settings → Environment Variables), for every environment
   you plan to use:

   | Variable | Value |
   | --- | --- |
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | long random string (command above) |
   | `ENCRYPTION_KEY` | 64 hex chars — **must stay identical forever** or stored messages become unreadable |

   Do **not** set `NEXT_PUBLIC_API_URL`; leaving it unset is what keeps the API same-origin.
3. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0`. Vercel Functions have no fixed
   outbound IPs, so an IP allowlist will simply time out.
4. Deploy. Check `https://<your-app>.vercel.app/api/health` — it should return
   `{"status":"ok","db":"connected"}`.

Everything else is already configured: `frontend/vercel.json` pins the framework, Node 22 comes
from `engines` + `.nvmrc`, and every API route is `runtime = "nodejs"` + `dynamic = "force-dynamic"`
so nothing is accidentally prerendered or cached.

### Housekeeping

Remove the demo/test accounts and their messages before going live:

```bash
cd frontend
npm run cleanup:test-users            # dry run - prints what it would delete
npm run cleanup:test-users -- --yes   # actually delete
```

It is a dry run unless `--yes` is passed, and it refuses to touch the real accounts listed in
`PROTECTED_USERNAMES`. Pass usernames as arguments to target a different set.

### Notes / caveats

- **Rotate committed secrets.** `backend/.env` was committed at some point; rotate the Atlas
  database password, `JWT_SECRET` and — if you can afford to lose existing message history —
  `ENCRYPTION_KEY` before making the repo or deployment public.
- **Polling costs invocations.** One `/api/sync` request per open tab every 2s. Comfortable on
  Hobby for a handful of users; if that changes, raise `POLL_ACTIVE_MS` in
  `frontend/lib/realtime.ts` or move realtime to a managed push service (Pusher/Ably).
- **Cold starts.** The first request after idle pays a Function cold start plus the Mongo
  handshake. The connection is cached per warm instance (`frontend/server/db.ts`).
- Auth is a first-party cookie on a single origin, so the third-party-cookie problem the split
  deployment had is gone.

### The legacy backend

`backend/` still contains the original Express + Socket.IO server, with `render.yaml` and a
Dockerfile for hosts that support long-running processes. It is not part of the Vercel deploy
and shares the same database schema. To use it instead, run it and set
`NEXT_PUBLIC_API_URL` to its origin. To drop it: `git rm -r backend render.yaml`.

## API

All routes are served from the Next.js app under `/api`.

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| GET    | `/api/health`             | –    | Liveness + DB reachability      |
| POST   | `/api/user/signup`        | –    | Create account, set cookie      |
| POST   | `/api/user/signin`        | –    | Log in, set cookie              |
| POST   | `/api/user/signout`       | –    | Clear cookie                    |
| GET    | `/api/user/user`          | ✓    | Current user                    |
| GET    | `/api/user/users?search=` | ✓    | User directory (excludes self)  |
| GET    | `/api/message/:userId`    | ✓    | Conversation history, marks read |
| POST   | `/api/message`            | ✓    | Send a message `{ to, text }`   |
| POST   | `/api/typing`             | ✓    | Publish typing state `{ to, typing }` |
| GET    | `/api/sync`               | ✓    | Poll: messages, presence, typing |
| ALL    | `/api/group/*`, `/api/channel/*` | – | Blueprint — always `501`    |

### `GET /api/sync`

Query: `peer` (the open conversation), `since` (cursor from the previous response),
`open=1` (thread is on screen, so incoming messages are marked read).

```jsonc
{
  "cursor": "2026-09-01T12:34:05.972Z", // feed back as `since` next time
  "online": ["<userId>", "..."],        // polled within the presence window
  "typing": false,                      // is `peer` typing at me right now
  "messages": []                        // new or changed, merge by _id
}
```
