# Chatboot

A simple, secure real-time 1:1 chat.

- **backend/** – Express 5 + MongoDB (Mongoose) + Socket.IO, TypeScript (run with `tsx`)
- **frontend/** – Next.js 16 (App Router) + React 19 + shadcn (base-nova) + `socket.io-client`

## Features

- Sign up / sign in / sign out — password hashed with bcrypt, session in an httpOnly JWT cookie
- User directory with search (by username or email)
- 1:1 chat over WebSockets (Socket.IO): live delivery, typing indicator, read receipts, online presence
- Messages are **encrypted at rest** (AES-256-GCM) — a database dump never exposes plaintext
- Groups & Channels are **blueprints only** — schemas and API routes are reserved (respond `501`) and the
  UI shows disabled entries; nothing is implemented yet

## Running locally

### 1. Backend

```bash
cd backend
cp .env.example .env      # then fill in MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY
npm install
npm run dev               # http://localhost:5000
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"        # ENCRYPTION_KEY
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                  # http://localhost:3000
```

The backend CORS origin is `FRONTEND_URL` from `backend/.env` (default `http://localhost:3000`,
comma-separated list allowed).

## Deployment

This is **two deployments**, not one:

| Part | Host | Why |
| --- | --- | --- |
| `frontend/` | **Vercel** (or any static/Next host) | Next.js builds to static pages |
| `backend/` | **Render / Railway / Fly.io** — *never Vercel* | Socket.IO needs a long-running process and real WebSockets, which serverless functions cannot provide |

> ⚠️ Pointing a Vercel project at `backend/` will not work. `backend/vercel.json` deliberately
> fails the build with this message so it can't half-deploy silently.

### 1. Backend → Render (blueprint included)

1. Render dashboard → **New → Blueprint** → pick this repo. It reads [`render.yaml`](render.yaml)
   and creates the `chatboot-backend` web service (root dir `backend`, health check `/health`).
2. Fill in the env vars it prompts for:
   - `MONGODB_URI` — your Atlas connection string
   - `ENCRYPTION_KEY` — 64 hex chars; **must stay identical forever** or stored messages
     become unreadable (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `FRONTEND_URL` — the deployed frontend origin, e.g. `https://cipherchat.vercel.app`
   - `JWT_SECRET` is generated automatically; `COOKIE_SAMESITE=none` / `COOKIE_SECURE=true` are preset.
3. Note the service URL, e.g. `https://chatboot-backend.onrender.com`.

Deploying by hand instead of by blueprint? Build with
`npm ci --include=dev && npm run build` and start with `npm start`.
The `--include=dev` matters: with `NODE_ENV=production`, plain `npm ci` skips devDependencies
and the TypeScript compiler goes missing.

For container hosts (Fly.io, Railway, any PaaS) use the multi-stage [`backend/Dockerfile`](backend/Dockerfile).

### 2. Frontend → Vercel

1. New Vercel project from this repo, **Root Directory = `frontend`**.
2. Env var `NEXT_PUBLIC_API_URL` = the backend URL from step 1.
3. Redeploy the backend afterwards if `FRONTEND_URL` changed — it drives CORS and Socket.IO origins.

### Housekeeping

Remove the demo/test accounts and their messages before going live:

```bash
cd backend
npm run cleanup:test-users            # dry run - prints what it would delete
npm run cleanup:test-users -- --yes   # actually delete
```

It is a dry run unless `--yes` is passed, and it refuses to touch the real
accounts listed in `PROTECTED_USERNAMES`. Pass usernames as arguments to target
a different set.

### Notes / caveats

- **Third-party cookies:** with the frontend and backend on different domains, Safari (and Firefox in
  strict mode) block the auth cookie even with `SameSite=None`. For guaranteed cross-browser auth,
  put both behind one domain (e.g. `app.example.com` + `api.example.com` with `COOKIE_DOMAIN=.example.com`)
  or switch auth to an `Authorization: Bearer` header.
- Presence tracking is in-memory — correct for a single instance only. Scaling to 2+ instances needs
  the Socket.IO Redis adapter and sticky sessions.
- Rotate any secret that was ever committed (`backend/.env` history) before going public.

## API

| Method | Route                     | Auth | Purpose                          |
| ------ | ------------------------- | ---- | -------------------------------- |
| POST   | `/user/signup`            | –    | Create account, set cookie      |
| POST   | `/user/signin`            | –    | Log in, set cookie              |
| POST   | `/user/signout`           | –    | Clear cookie                    |
| GET    | `/user/user`              | ✓    | Current user                    |
| GET    | `/user/users?search=`     | ✓    | User directory (excludes self)  |
| GET    | `/message/:userId`        | ✓    | Conversation history, marks read |
| ALL    | `/group/*`, `/channel/*`  | –    | Blueprint — always `501`         |

### Socket.IO events

Client → server: `message:send` `{ to, text }`, `message:read` `{ from }`, `typing` `{ to, typing }`
Server → client: `message:new`, `message:read` `{ by, ids }`, `typing` `{ from, typing }`,
`presence:list` / `presence:online` / `presence:offline`
