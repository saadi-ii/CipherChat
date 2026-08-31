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

Frontend and backend deploy **separately**. Socket.IO needs a long-running Node process, so the
backend can't run on serverless (Vercel/Netlify functions).

### Backend → Render / Railway / Fly / any Node host

- `render.yaml` is included (Render blueprint). Otherwise: build `npm ci && npm run build`, start `npm start`.
- A multi-stage `backend/Dockerfile` is included for container hosts.
- Required env vars: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ENCRYPTION_KEY` (64 hex,
  **must stay stable** or stored messages become unreadable), `FRONTEND_URL` (the deployed frontend origin).
- For a cross-domain frontend also set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.
  `TRUST_PROXY` turns on automatically in production.
- Health check: `GET /health`.

### Frontend → Vercel

- Set the project **Root Directory** to `frontend`.
- Env var: `NEXT_PUBLIC_API_URL` = the deployed backend origin (e.g. `https://chatboot-backend.onrender.com`).

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
