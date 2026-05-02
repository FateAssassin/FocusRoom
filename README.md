# FocusRoom

A collaborative focus / Pomodoro web app. Sign up, add friends, start a room, and run a synced Pomodoro timer with chat in real time. Admins can publish blog posts. Server-side timer authority, host-only controls, and a friend system are all wired up.

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
- Blog system (admin-authored):
  - Tiptap rich-text editor
  - HTML sanitized with DOMPurify before render
  - Per-post `BlogPosting` JSON-LD schema for SEO
- SEO basics: `metadataBase`, OG / Twitter cards, root OG image, `robots.ts`, dynamic `sitemap.ts`

## Stack

| Layer       | Tech                                                      |
| ----------- | --------------------------------------------------------- |
| Framework   | Next.js **16.2.1** (App Router, Turbopack)                |
| UI          | React **19.2.4**, Tailwind CSS **v4**                     |
| Language    | TypeScript                                                |
| Auth        | NextAuth v4 (Credentials + JWT)                           |
| Database    | better-sqlite3 (local `focusroom.db`)                     |
| Real-time   | socket.io 4 on a custom Node server                       |
| Editor      | Tiptap 3 (`@tiptap/react`, `starter-kit`)                 |
| Sanitizer   | isomorphic-dompurify                                      |
| Hashing     | bcrypt                                                    |
| Icons       | bootstrap-icons                                           |
| Package mgr | pnpm                                                      |

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

`NEXTAUTH_SECRET` is required — the socket.io handshake decodes the NextAuth session cookie with it. Generate one with `openssl rand -hex 32`. In production, set `NEXTAUTH_URL` to your real domain — `metadataBase`, `robots.ts`, `sitemap.ts`, and the blog JSON-LD all read from it.

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
  layout.tsx                 root layout, metadata, NextAuth SessionProvider
  page.tsx                   landing page
  not-found.tsx              site-wide 404
  globals.css                Tailwind v4 theme + .button-main, .button-secondary, .card, .blog-prose
  icon.png                   favicon / app icon
  opengraph-image.jpg        default OG / Twitter card image
  robots.ts                  generated robots.txt (allowlist + sitemap pointer)
  sitemap.ts                 dynamic sitemap (landing, blog, every blog post, rooms)

  api/
    auth/[...nextauth]/      NextAuth handler
    auth/register/           POST — sign up (rate-limited, bcrypt)
    friends/incoming-count/  GET — count of pending incoming friend requests
    profile/getprofilebyid/  GET — user lookup
    profile/updateDescription/ POST
    profile/updatepicture/   POST — multipart upload to public/uploads/profile-pictures/

  components/
    navbar.tsx, footer.tsx, alert.tsx
    create-room.tsx
    blog-editor.tsx          Tiptap editor wrapper
    profile/changeProfilePicture.tsx, profile/editDescription.tsx

  lib/
    auth/auth-options.ts     NextAuthOptions (Credentials + jwt/session callbacks)
    db/db.ts                 better-sqlite3 singleton ("server-only")
    db/create-db.js          one-off table bootstrap script
    db/users.ts              user queries
    db/rooms.ts              room CRUD with RoomMutationResult error handling
    db/friends.ts            friend system queries
    db/blogs.ts              blog CRUD with BlogMutationResult error handling
    db/admins.ts             isAdmin(userId) lookup
    actions.ts               'use server' actions (rooms, friends, join-by-code)
    blog-actions.ts          'use server' actions (create/update/delete blog, admin-gated)
    sanitize-blog.ts         DOMPurify wrapper for blog HTML
    rate-limit.ts            in-memory token bucket (registration, join-by-code)

  signin/, signup/           auth pages
  profile/page.tsx           own profile (description, picture, owned room)
  profile/[id]/page.tsx      any user's profile (friend button, public room)
  friends/page.tsx           friends list + incoming/outgoing requests
  rooms/page.tsx             public room browser
  rooms/create/              create-room page + form + existing-room redirect + error boundary
  room/[id]/                 live room view (server component + socket.io client)
  blog/page.tsx              blog index (all posts)
  blog/create/page.tsx       new post (admin-only)
  blog/[id]/page.tsx         post view, with BlogPosting JSON-LD
  blog/[id]/edit/page.tsx    edit post (admin-only)
  blog/[id]/delete-button.tsx, blog/[id]/not-found.tsx

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

## How blogs work

- Posts live in the `blogs` table; CRUD lives in `app/lib/db/blogs.ts`.
- Authoring uses Tiptap's `StarterKit` via `app/components/blog-editor.tsx`.
- Submitted HTML is run through `sanitizeBlogHtml` (DOMPurify) before render — never trust the editor's HTML.
- `app/lib/blog-actions.ts` server actions check `isAdmin(session.user.id)` before mutating. Non-admins get a generic error.
- There is **no UI to grant admin** — insert directly into the `admins` table:
  ```bash
  sqlite3 focusroom.db "INSERT INTO admins (user_id) VALUES (1);"
  ```
- Each post page emits a `BlogPosting` JSON-LD script with `headline`, `datePublished`, `dateModified`, `author`, and a canonical URL built from `NEXTAUTH_URL`. Validate with Google's [Rich Results Test](https://search.google.com/test/rich-results).

## Auth

- NextAuth v4, Credentials provider, JWT session strategy.
- Session shape extended in `next-auth.d.ts` with `id`, `profilePictureLink`, `description`, `createdAt`.
- Server components: `getServerSession(authOptions)`. Client components: `useSession()`.
- Sign-in page configured via `authOptions.pages.signIn = "/signin"`.
- Passwords are hashed with bcrypt; minimum length is **8 characters**.
- Registration is rate-limited to 5 attempts per 10 minutes per IP. `joinRoomByCode` is rate-limited to 10 per minute per IP.

## Data model

Tables defined in `app/lib/db/create-db.js`:

| Table              | Notes                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| `users`            | `name` and `email` are unique; password is a bcrypt hash                         |
| `profile_pictures` | history of uploaded pictures (the live link is denormalized on `users`)          |
| `admins`           | `user_id` unique; gates blog create/edit/delete                                  |
| `friends`          | `(user_id, friend_id)` unique, `accepted` flag for pending                       |
| `rooms`            | `UNIQUE(host_id, invite_code)`; "one room per host" is enforced at the API layer |
| `blogs`            | `author_id` foreign key to `users`; `created_at` / `updated_at` auto-managed     |

## SEO

- `app/layout.tsx` sets a full root `Metadata` block: `metadataBase` (from `NEXTAUTH_URL`), title template, OG, Twitter card, robots config, icons.
- `app/opengraph-image.jpg` is auto-picked up by Next as the default OG image.
- `app/robots.ts` allows everything except `/api/`, `/blog/new`, `/blog/*/edit`, `/profile`, `/friends`, `/rooms/create`, `/room/`.
- `app/sitemap.ts` revalidates every hour and includes `/`, `/blog`, every `/blog/{id}`, and `/rooms`.
- Blog post pages emit `BlogPosting` JSON-LD inline.

## Known rough edges

These are intentional in the test build — leave them alone unless asked.

- Room state is held in-memory per Node process. Restarting clears all live sessions.
- Vercel-style serverless deployment does not work — the custom Node server is required.
- The `create-db.js` script's relative DB path only resolves when run from `app/lib/db/`.
- No UI to grant admin status — must be inserted into `admins` directly.
- Password minimum is 8 chars with no complexity requirements.

## Roadmap

- Persist timer state across restarts
- Richer chat (presence, system messages, reactions)
- Per-user session history and stats
- Better mobile layout
- A working hosted deployment

## License

MIT — see [`LICENSE`](./LICENSE).
