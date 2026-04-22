@AGENTS.md

# FocusRoom

Collaborative focus/Pomodoro web app. Users sign up, create a room, and (eventually) share a synced timer with friends. Currently a test build — auth + profile flows work; real-time room/timer sync is not implemented.

## Stack

- **Next.js 16.2.1** (App Router) + **React 19.2.4** — this is not the Next.js your training data knows. Before writing routing, caching, metadata, form, or server-component code, read the matching file under `node_modules/next/dist/docs/` (structured as `01-app/02-pages/03-architecture/04-community`). Heed the `{/* AI agent hint: ... */}` callouts — they flag breaking behaviour.
- **TypeScript**, **Tailwind CSS v4** (with `@theme inline` and `@custom-variant` syntax — also new)
- **NextAuth v4** (Credentials provider, JWT session strategy)
- **better-sqlite3** against a local `focusroom.db` file
- **pnpm** (workspace configured — use `pnpm`, not `npm`/`yarn`). `better-sqlite3` is the only allowed built dep.

## Commands

```bash
pnpm install
pnpm dev              # next dev
pnpm build            # next build
pnpm start            # next start
pnpm lint             # eslint
```

There is no test runner configured.

## Layout

```
app/
  layout.tsx              root layout, wraps everything in <Providers> (SessionProvider)
  page.tsx                landing page (client component, reads useSession)
  providers.tsx           client SessionProvider wrapper
  not-found.tsx           site-wide 404
  globals.css             Tailwind v4 + custom classes (.button-main, .button-secondary, .card)

  api/
    auth/[...nextauth]/route.ts   NextAuth handler (GET+POST)
    auth/register/route.ts         POST — hash password, insert user
    createroom/route.tsx           POST — create a room for a host
    profile/getprofilebyid/route.ts   GET — user lookup
    profile/updateDescription/route.ts POST
    profile/updatepicture/route.ts    POST — multipart upload to public/uploads/profile-pictures/

  components/
    navbar.tsx, alert.tsx, create-room.tsx
    profile/changeProfilePicture.tsx, profile/editDescription.tsx

  lib/
    auth/auth-options.ts    NextAuthOptions (Credentials + jwt/session callbacks)
    auth/auth.ts            jsonwebtoken sign/verify helpers (JWT_SECRET)
    db/db.ts                 singleton better-sqlite3 connection ("server-only")
    db/create-db.js          one-off table bootstrap script
    db/users.ts, db/rooms.ts  query helpers
    actions.ts               'use server' placeholder (empty)

  signin/page.tsx, signup/page.tsx
  profile/page.tsx, profile/[id]/page.tsx
  rooms/page.tsx, rooms/create/{page,form,ExistingRoomRedirect}.tsx
  room/page.tsx, room/[id]/{page,not-found}.tsx   ← currently empty stubs
  friends/page.tsx          placeholder
```

Path alias: `@/*` → project root (see `tsconfig.json`). Import as `@/app/lib/db/db`.

## Data model (SQLite)

Tables defined in `app/lib/db/create-db.js`: `users`, `profile_pictures`, `admins`, `friends`, `rooms`. `rooms.host_id` is unique per `(host_id, invite_code)` — the app currently enforces "one room per host" at the API layer.

`focusroom.db` sits in the project root and is **gitignored**. To reinitialise, run `node app/lib/db/create-db.js` (note: the script's relative DB path is wrong when run from root — adjust if re-running or run from inside `app/lib/db/`).

## Auth

NextAuth v4 with a Credentials provider, JWT session strategy. Session shape is extended in `next-auth.d.ts` to carry `id`, `profilePictureLink`, `description`, `createdAt`. In server components, read via `getServerSession(authOptions)`; in client components, `useSession()`. Sign-in page is `/signin` (configured via `authOptions.pages.signIn`).

Required env in `.env.local`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
JWT_SECRET=...
```

## Conventions and gotchas

- **Server-only modules:** `app/lib/db/db.ts` and `app/lib/auth/auth-options.ts` start with `import "server-only"`. Never import them from a `"use client"` file.
- **Dynamic route params:** Next 16 makes `params` async. See `app/profile/[id]/page.tsx` — `const param = await params;`. Follow that pattern in new dynamic routes.
- **better-sqlite3 is synchronous.** Don't `await` it. Do not wrap handlers just to make the DB calls async.
- **Tailwind v4** — no `tailwind.config.js`. Theme and custom classes live in `app/globals.css` using `@theme inline` and `@layer components`. Reuse `.button-main`, `.button-secondary`, `.card` before inventing new ones.
- **Icons** come from `bootstrap-icons` (`<i className="bi bi-..."></i>`), imported once in `layout.tsx`.
- **Uploads** go to `public/uploads/profile-pictures/` (gitignored). The upload route unlinks the previous file when replacing.
- **`app/room/*`** contains empty placeholder files — the real room view isn't built yet. `app/rooms/*` is the listing/creation surface. Don't confuse the two.
- **Security notes to be aware of, not silently "fix":** `api/createroom` trusts the `hostId` from the request body instead of reading it from the session, and password minimum is 6 chars. These are known rough edges in the test build; leave alone unless asked.
- **Deployment:** Vercel is not currently working (see README). Don't assume a production URL.

## Working style

- This is a solo hobby/test build — prefer small, direct edits over large refactors. Ask before restructuring.
- Don't add testing, CI, or lint rules that aren't already there.
- Don't create new Markdown docs unless asked.
