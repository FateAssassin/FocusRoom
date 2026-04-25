# FocusRoom

FocusRoom is a collaborative focus/Pomodoro app built with Next.js, React, NextAuth, and SQLite. The idea is simple: create a place where people can study or work together, stay accountable, and share live focus sessions in real time.

## Status

Still being built, but the core room loop now works end-to-end.

What's working:

- Landing page
- Email/password sign up and sign in (NextAuth, JWT sessions)
- Profile page, description editing, profile picture upload
- Room listing and creation
- **Live rooms** over socket.io: shared Pomodoro timer, chat, and member list
- Host-only controls: set duration/phase, start/pause/reset, kick members
- Local SQLite database for user and room data

Known rough edges (intentional for the test build):

- `api/createroom` trusts `hostId` from the request body rather than the session
- Minimum password length is 6
- Room state is held in-memory on the server, so restarting the dev server clears active sessions
- Vercel deployment is not currently working (custom server is required)

## Stack

- Next.js 16.2.1 (App Router, Turbopack)
- React 19
- TypeScript
- NextAuth v4 (Credentials + JWT)
- socket.io 4 (via a custom Node server)
- better-sqlite3 / SQLite
- Tailwind CSS 4
- pnpm

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment variables

Create a `.env.local` file in the project root:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
```

`NEXTAUTH_SECRET` must be set — the socket.io handshake uses it to verify the session cookie. Generate one with `openssl rand -hex 32` (or any strong random string).

### 3. Initialize the database

A local SQLite file (`focusroom.db`) lives in the project root and is gitignored. If it doesn't exist yet, create the tables:

```bash
cd app/lib/db
node create-db.js
cd ../../..
```

> The script uses a relative path, so run it from inside `app/lib/db/` (or adjust the path in the file).

### 4. Start the dev server

```bash
pnpm dev
```

This runs `node server.js` — a custom Node server that wraps Next.js and attaches socket.io at `/api/socket`. You should see:

```
[server.js] NEXTAUTH_SECRET loaded.
> FocusRoom ready on http://localhost:3000 (dev)
```

Then open http://localhost:3000.

### 5. Production

```bash
pnpm build
pnpm start
```

`pnpm start` runs `cross-env NODE_ENV=production node server.js` (the same custom server, in production mode). Plain `next start` will not work — it does not mount the socket server.

## Scripts

| Script       | What it runs                                  |
| ------------ | --------------------------------------------- |
| `pnpm dev`   | `node server.js` (Next + socket.io, dev mode) |
| `pnpm build` | `next build`                                  |
| `pnpm start` | `node server.js` in production                |
| `pnpm lint`  | ESLint                                        |

There is no test runner configured.

## Project Structure

```text
server.js                  custom Node server: Next request handler + socket.io
app/
  layout.tsx               wraps app in NextAuth SessionProvider
  api/                     route handlers (auth, profile, rooms)
  components/              shared UI (navbar, alerts, forms)
  lib/
    auth/                  NextAuth config + JWT helpers
    db/                    better-sqlite3 singleton + table bootstrap
  profile/                 /profile, /profile/[id]
  rooms/                   room listing + creation
  room/[id]/               the live room view (socket.io client)
  signin/, signup/         auth pages
public/
  uploads/profile-pictures/  (gitignored, created on first upload)
focusroom.db               SQLite database (gitignored)
```

## How rooms work

- Client opens `/room/[id]`, which renders a server component that verifies the session and loads the room row.
- The client component (`app/room/[id]/room-view.tsx`) opens a socket.io connection to `/api/socket`.
- `server.js` reads the NextAuth session cookie, decodes the JWT with `NEXTAUTH_SECRET`, and binds `userId` / `userName` onto the socket.
- The server is the source of truth for the timer. Only the host (user whose id equals `rooms.host_id`) can `timer:set`, `timer:start`, `timer:pause`, `timer:reset`, and `user:kick`.
- Room state is kept in memory per Node process (`Map<roomId, { members, timer, ... }>`). Restart the server → all sessions clear.

## Notes

- Uploaded profile pictures are saved to `public/uploads/profile-pictures/`.
- All secrets must be set in `.env.local` — nothing should be committed.
- This README reflects the current test build, not the final planned product.

## Roadmap

- Persist timer state across restarts
- Invite-only / private rooms + invite codes end-to-end
- Presence indicators and richer chat (reactions, system messages)
- Session history and stats per user
- Better mobile layout

## License

No license has been added yet.
