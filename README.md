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

Generate `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                  # http://localhost:3000
```

The backend CORS origin is `frontend_url` from `backend/.env` (default `http://localhost:3000`).

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
