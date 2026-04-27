# FocusRoom

A collaborative focus / Pomodoro web app. Sign up, create a room, and run a synced Pomodoro timer with friends in real time. Server-side timer authority, host-only controls, in-room chat, and a friend system are all wired up.

> **Status:** test build. The core room loop works end-to-end, but room state is held in memory on the Node process — restarting the server clears active sessions. See [Known rough edges](#known-rough-edges).

## Features

- Email + password sign up / sign in (NextAuth v4, JWT sessions)
- User profiles with editable description and uploadable picture
- Friend system: send / accept / decline / cancel / remove requests
- Public and private rooms with invite codes
- Live rooms over **socket.io**:
  - Shared Pomodoro timer (focus / break, configurable duration)
  - Host-only controls: set, start, pause, reset, kick
  - In-room chat
  - Live member list
  - Server is the timer source of truth

## Stack

| Layer       | Tech                                       |
| ----------- | ------------------------------------------ |
| Framework   | Next.js **16.2.1** (App Router, Turbopack) |
| UI          | React **19.2.4**, Tailwind CSS **v4**      |
| Language    | TypeScript                                 |
| Auth        | NextAuth v4 (Credentials + JWT)            |
| Database    | better-sqlite3 (local `focusroom.db`)      |
| Real-time   | socket.io 4 on a custom Node server        |
| Hashing     | bcrypt                                     |
| Icons       | bootstrap-icons                            |
| Package mgr | pnpm                                       |

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

`better-sqlite3` is the only allowed built dependency (see `pnpm-workspace.yaml`).

### 2. Create `.env.local`

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
```

`NEXTAUTH_SECRET` is required — the socket.io handshake decodes the NextAuth session cookie with it. Generate one with `openssl rand -hex 32`.

### 3. Initialize the database

The SQLite file `focusroom.db` lives in the project root and is gitignored. To create the tables:

```bash
cd app/lib/db
node create-db.js
cd ../../..
```

> The script uses a relative path, so it must be run from inside `app/lib/db/` (or adjust the path in the file).

### 4. Run the dev server

```bash
pnpm dev
```

This runs `node server.js` — a custom HTTP server that wraps Next (Turbopack) and mounts socket.io at `/api/socket`. Then open http://localhost:3000.

### 5. Production

```bash
pnpm build
pnpm start
```

`pnpm start` runs `cross-env NODE_ENV=production node server.js`. **Plain `next start` will not work** — it does not mount the socket server.

## Scripts

| Script       | Runs                                          |
| ------------ | --------------------------------------------- |
| `pnpm dev`   | `node server.js` (Next + socket.io, dev mode) |
| `pnpm build` | `next build`                                  |
| `pnpm start` | `node server.js` in production                |
| `pnpm lint`  | ESLint                                        |

There is no test runner configured.

## Project structure

```text
server.js                    custom Node HTTP server: Next handler + socket.io
next.config.ts               next config (allowedDevOrigins for LAN dev)
next-auth.d.ts               session/JWT type extensions

app/
  layout.tsx                 root layout, wraps app in NextAuth SessionProvider
  page.tsx                   landing page
  not-found.tsx              site-wide 404
  globals.css                Tailwind v4 theme + .button-main, .button-secondary, .card

  api/
    auth/[...nextauth]/      NextAuth handler
    auth/register/           POST — sign up (rate-limited, bcrypt)
    createroom/              POST — create a room (used by an older client path)
    friends/incoming-count/  GET — count of pending incoming friend requests
    profile/getprofilebyid/  GET — user lookup
    profile/updateDescription/ POST
    profile/updatepicture/   POST — multipart upload to public/uploads/profile-pictures/

  components/
    navbar.tsx, alert.tsx, create-room.tsx
    profile/changeProfilePicture.tsx, profile/editDescription.tsx

  lib/
    auth/auth-options.ts     NextAuthOptions (Credentials + jwt/session callbacks)
    auth/auth.ts             jsonwebtoken sign/verify helpers
    db/db.ts                 better-sqlite3 singleton ("server-only")
    db/create-db.js          one-off table bootstrap script
    db/users.ts              user queries
    db/rooms.ts              room CRUD with RoomMutationResult error handling
    db/friends.ts            friend system queries
    actions.ts               'use server' actions (rooms, friends, join-by-code)
    rate-limit.ts            in-memory token bucket (registration, join-by-code)

  signin/, signup/           auth pages
  profile/page.tsx           own profile (description, picture, owned room)
  profile/[id]/page.tsx      any user's profile (friend button, public room)
  friends/page.tsx           friends list + incoming/outgoing requests
  rooms/page.tsx             public room browser
  rooms/create/              create-room page + form + existing-room redirect + error boundary
  room/[id]/                 live room view (server component + socket.io client)

public/
  uploads/profile-pictures/  gitignored, created on first upload
focusroom.db                 SQLite database (gitignored)
```

Path alias: `@/*` → project root (see `tsconfig.json`). Import as `@/app/lib/db/db`.

## How rooms work

1. The user opens `/room/[id]`. The server component validates the session and loads the room row from SQLite.
2. The client component (`app/room/[id]/room-view.tsx`) opens a socket.io connection to `/api/socket`.
3. `server.js` reads the NextAuth session cookie, decodes the JWT with `NEXTAUTH_SECRET`, and binds `userId` / `userName` onto the socket.
4. The server maintains room state in memory: `Map<roomId, { hostId, members, timer, tickHandle }>`. Restarting the server clears it.
5. Only the host (the user whose `id` equals `rooms.host_id`) can emit `timer:set`, `timer:start`, `timer:pause`, `timer:reset`, and `user:kick`. The server enforces this regardless of what the client sends.
6. The server ticks running timers every second and broadcasts state to the room.

## Auth

- NextAuth v4, Credentials provider, JWT session strategy.
- Session shape extended in `next-auth.d.ts` with `id`, `profilePictureLink`, `description`, `createdAt`.
- Server components: `getServerSession(authOptions)`. Client components: `useSession()`.
- Sign-in page configured via `authOptions.pages.signIn = "/signin"`.
- Passwords are hashed with bcrypt; minimum length is **8 characters**.
- Registration is rate-limited to 5 attempts per 10 minutes per IP. `joinRoomByCode` is rate-limited to 10 per minute per IP.

## Data model

Tables defined in `app/lib/db/create-db.js`:

| Table              | Notes                                                        |
| ------------------ | ------------------------------------------------------------ |
| `users`            | `name` and `email` are unique; password is a bcrypt hash     |
| `profile_pictures` | history of uploaded pictures (the live link is on `users`)   |
| `admins`           | reserved (no UI yet)                                          |
| `friends`          | `(user_id, friend_id)` unique, `accepted` flag for pending   |
| `rooms`            | `UNIQUE(host_id, invite_code)`; "one room per host" is enforced at the API layer |

## Known rough edges

These are intentional in the test build — leave them alone unless asked.

- `POST /api/createroom` trusts `hostId` from the request body in addition to the session.
- Room state is held in-memory per Node process. Restarting clears all live sessions.
- Vercel deployment does not work — a custom Node server is required.
- The `create-db.js` script's relative DB path only resolves when run from `app/lib/db/`.

## Roadmap

- Persist timer state across restarts
- Richer chat (presence, system messages, reactions)
- Per-user session history and stats
- Better mobile layout
- A working hosted deployment

## License

MIT — see [`LICENSE`](./LICENSE).
