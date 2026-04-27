@AGENTS.md

# FocusRoom

Collaborative focus / Pomodoro web app. Users sign up, add friends, create a room, and run a synced timer with chat. Auth, profiles, friends, room creation/edit/delete, and live rooms (socket.io with server-side timer authority) all work. Room state is in-memory per Node process — there is no real-time persistence yet.

## Stack

- **Next.js 16.2.1** (App Router, Turbopack) + **React 19.2.4** — this is **not** the Next.js your training data knows. Before writing routing, caching, metadata, form, or server-component code, read the matching file under `node_modules/next/dist/docs/` (structured as `01-app/02-pages/03-architecture/04-community`). Heed the `{/* AI agent hint: ... */}` callouts — they flag breaking behavior.
- **TypeScript**, **Tailwind CSS v4** (with `@theme inline` and `@custom-variant` syntax — also new; no `tailwind.config.js`)
- **NextAuth v4** (Credentials provider, JWT session strategy)
- **socket.io 4** mounted on a **custom Node server** (`server.js`), not Next's built-in server
- **better-sqlite3** against a local `focusroom.db` file
- **bcrypt** for password hashing (min length 8)
- **pnpm** workspace — `better-sqlite3` is the only allowed built dep. Use `pnpm`, not `npm`/`yarn`.

## Commands

```bash
pnpm install
pnpm dev              # node server.js (Next + socket.io, dev)
pnpm build            # next build
pnpm start            # node server.js in production (NOT next start)
pnpm lint             # eslint
```

There is no test runner.

> `next start` will not work — the custom server is required to mount socket.io at `/api/socket`. If you ever change `pnpm start` to `next start`, sockets break silently.

## Layout

```
server.js                    custom HTTP server: Next handler + socket.io @ /api/socket
next.config.ts               allowedDevOrigins for LAN dev
next-auth.d.ts               extends Session/User/JWT with id, profilePictureLink, description, createdAt

app/
  layout.tsx                 root layout, wraps app in <Providers> (SessionProvider) + bootstrap-icons
  page.tsx                   landing page (client, reads useSession)
  providers.tsx              client SessionProvider wrapper
  not-found.tsx              site-wide 404
  globals.css                Tailwind v4 + .button-main, .button-secondary, .card

  api/
    auth/[...nextauth]/route.ts        NextAuth handler (GET+POST)
    auth/register/route.ts             POST — bcrypt hash + insert (rate-limited)
    createroom/route.tsx               POST — older client-side create path (still wired)
    friends/incoming-count/route.ts    GET — pending incoming requests count
    profile/getprofilebyid/route.ts    GET — user lookup
    profile/updateDescription/route.ts POST
    profile/updatepicture/route.ts     POST — multipart upload, unlinks previous

  components/
    navbar.tsx, alert.tsx, create-room.tsx
    profile/changeProfilePicture.tsx, profile/editDescription.tsx

  lib/
    auth/auth-options.ts     NextAuthOptions (Credentials + jwt/session callbacks). "server-only".
    auth/auth.ts             jsonwebtoken sign/verify helpers (JWT_SECRET, 7-day expiry)
    db/db.ts                 singleton better-sqlite3 connection. "server-only".
    db/create-db.js          one-off table bootstrap (run from inside app/lib/db/)
    db/users.ts              user queries
    db/rooms.ts              room CRUD; mutators return RoomMutationResult<T>; readers swallow errors and return safe defaults
    db/friends.ts            friend system queries
    actions.ts               'use server' actions: createRoom / updateMyRoom / deleteMyRoom / friend actions / joinRoomByCode
    rate-limit.ts            in-memory token-bucket; helpers: rateLimit, getClientIp, retryAfterSeconds

  signin/page.tsx, signup/page.tsx
  profile/page.tsx                     own profile (description, picture, owned room card)
  profile/[id]/page.tsx                any user's profile (friend button, public room card)
  profile/[id]/friend-button.tsx       client component for friendship state
  friends/page.tsx                     friends + incoming/outgoing requests
  rooms/page.tsx                       public room browser
  rooms/rooms-browser.tsx              client browser for the rooms list
  rooms/existingRoom.tsx               existing-room banner used in browser
  rooms/create/page.tsx                gate: redirects to ExistingRoomRedirect if user already hosts a room
  rooms/create/form.tsx                client form, calls createRoomAction, shows errors via <Alert>
  rooms/create/ExistingRoomRedirect.tsx auto-redirects to user's existing room
  rooms/create/error.tsx               error boundary for /rooms/create
  room/[id]/page.tsx                   server component: validates session + loads room
  room/[id]/room-view.tsx              client: socket.io client, timer UI, chat, member list
  room/[id]/not-found.tsx              room-specific 404
```

Path alias: `@/*` → project root (`tsconfig.json`). Import as `@/app/lib/db/db`.

## Data model (SQLite)

Tables in `app/lib/db/create-db.js`:

- `users` — `name` and `email` unique; password is a bcrypt hash; `created_at` defaulted.
- `profile_pictures` — historical record of uploaded pictures (the live link is denormalized onto `users.profile_picture_link`).
- `admins` — reserved, no UI.
- `friends` — `(user_id, friend_id)` unique with `accepted` boolean. Friendships are stored as a single directed row that flips to `accepted = 1` on accept; `getFriendshipStatus` and friends queries handle direction.
- `rooms` — `UNIQUE(host_id, invite_code)`. The app enforces "one room per host" at the API/action layer (not at the DB).

`focusroom.db` sits in the project root and is **gitignored**. To reinitialise:

```bash
cd app/lib/db && node create-db.js
```

The script's relative DB path only resolves from inside `app/lib/db/` — adjust if running from elsewhere.

## Auth

- NextAuth v4, Credentials provider, JWT session strategy.
- Session shape extended in `next-auth.d.ts` with `id`, `profilePictureLink`, `description`, `createdAt`. Both `jwt` and `session` callbacks in `auth-options.ts` populate them.
- Server components: `getServerSession(authOptions)`. Client components: `useSession()`.
- Sign-in route configured via `authOptions.pages.signIn = "/signin"`.
- `app/lib/auth/auth.ts` exports `signToken` / `verifyToken` helpers (currently unused by routes — kept around for non-NextAuth JWT use cases like the socket handshake).

Required env in `.env.local`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
JWT_SECRET=...
```

`NEXTAUTH_SECRET` is critical: `server.js` uses it to decode the NextAuth session cookie on every socket handshake. Without it, sockets reject everyone.

## Real-time / socket.io

`server.js` is the only entry point in dev and prod. It:

1. Boots Next.js (with Turbopack in dev).
2. Creates an HTTP server that delegates to the Next request handler.
3. Mounts socket.io at `/api/socket`.
4. On socket handshake: reads `__Secure-next-auth.session-token` (or `next-auth.session-token`), decodes it with `NEXTAUTH_SECRET`, and binds `userId` / `userName` / `pic` onto `socket.data`. Rejects unauthenticated sockets.

Events:

- `room:join` — validates room exists and capacity, attaches member, emits room state.
- `timer:set` / `timer:start` / `timer:pause` / `timer:reset` — **host-only**, enforced server-side.
- `chat:send` — broadcast within room, max 500 chars.
- `user:kick` — host-only; cannot target the host themselves.
- `disconnect` — removes member; deletes the room from the in-memory map when empty.

State:

- `rooms: Map<roomId, { hostId, members, timer, tickHandle }>` lives **per Node process**. Restart the server → all rooms clear.
- Timer object: `{ phase, durationMs, remainingMs, startedAt, running }`. The server is the source of truth; clients render whatever the server sends.

## Conventions and gotchas

- **Server-only modules:** `app/lib/db/db.ts` and `app/lib/auth/auth-options.ts` start with `import "server-only"`. Never import them from a `"use client"` file.
- **Dynamic route params are async** in Next 16: `const param = await params;`. See `app/profile/[id]/page.tsx` and `app/room/[id]/page.tsx` — follow the pattern in new dynamic routes.
- **better-sqlite3 is synchronous.** Never `await` it. Don't make a handler async just to call DB helpers.
- **Tailwind v4** has no config file. Theme and custom classes live in `app/globals.css` via `@theme inline` and `@layer components`. Reuse `.button-main`, `.button-secondary`, `.card` before inventing new ones.
- **Icons** come from `bootstrap-icons` (`<i className="bi bi-..."></i>`), imported once in `layout.tsx`.
- **Uploads** go to `public/uploads/profile-pictures/` (gitignored). The upload route unlinks the previous file when replacing.
- **`app/room/*` vs `app/rooms/*`** — `rooms/` is the listing/creation surface; `room/[id]/` is the live room view. Don't confuse the two.
- **Room DB error handling** — `app/lib/db/rooms.ts` mutators (`createRoom`, `updateRoom`, `deleteRoom`, `deleteRoomsByHostId`) return `RoomMutationResult<T> = { ok: true, data } | { ok: false, error }`. Readers (`getRoomById`, `getRoomByHostId`, `getAllRooms`) log on failure and return `undefined`/`[]`. Server actions in `app/lib/actions.ts` propagate `error` strings up to the form, which renders them via the shared `<Alert>` component.
- **Rate limiting** — `app/lib/rate-limit.ts` is an in-memory token-bucket. Used in `auth/register` (5 / 10 min / IP) and `joinRoomByCode` (10 / min / IP). It does not persist across restarts.
- **Custom Node server** — never replace `pnpm dev` or `pnpm start` with `next dev` / `next start`; you'll silently lose socket.io.

## Security notes (known, do not silently "fix")

- `api/createroom` accepts `hostId` from the request body in addition to the session.
- Password minimum is 8 chars (no complexity requirements).
- Room state is in-memory and not persisted. Server restart drops every active room.
- These are documented rough edges in the test build — leave alone unless asked.

## Working style

- Solo hobby/test build — prefer small, direct edits over large refactors. Ask before restructuring.
- Don't add testing, CI, or lint rules that aren't already there.
- Don't create new Markdown docs unless asked.
- Don't add features, validation, or fallbacks beyond what the task requires.
