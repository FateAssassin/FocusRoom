# FocusRoom

FocusRoom is a test version of a collaborative focus app built with Next.js, React, NextAuth, and SQLite. The idea is simple: create a place where people can study or work together, stay accountable, and eventually share focus sessions in real time.

## Status

This project is still being built.

What is available in this test version:

- Landing page for the product concept
- Email/password sign up and sign in
- Session-based authentication with NextAuth
- Profile page for logged-in users
- Profile description editing
- Profile picture upload/update flow
- Room listing page
- Basic room creation entry point and guest join flow UI
- Local SQLite database for user data

What is still incomplete or clearly in progress:

- Real room/session functionality is not finished yet
- Room creation is only partially scaffolded
- Shared timer and live sync features are not implemented yet
- Some pages and flows are still test-stage placeholders

## Stack

- Next.js 16
- React 19
- TypeScript
- NextAuth
- better-sqlite3 / SQLite
- Tailwind CSS 4
- Planned: socket.io

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment variables

Create a `.env.local` file with values like these:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
```

### 3. Make sure the database exists

This project uses a local SQLite database file named `focusroom.db` in the project root.

If you are setting things up from scratch, initialize the database tables with:

```bash
node app/lib/db/create-db.js
```

### 4. Start the dev server

```bash
pnpm dev
```

Then open `http://localhost:3000`.

## Current Project Structure

```text
app/
  api/
  components/
  lib/
  profile/
  rooms/
  signin/
  signup/
public/
focusroom.db
```

## Notes

- This README describes the current test build, not the final planned product.
- The rooms feature currently uses in-memory room data, so it is not production-ready.
- Uploaded profile pictures are stored under `public/uploads/profile-pictures`.
- Authentication depends on valid environment secrets being set locally.
- The deployment on Vercel may not work properly yet.

## Roadmap Direction

Planned improvements include:

- Proper room creation and joining
- Shared Pomodoro sessions
- Real-time presence and timer syncing
- Better room management
- More polished UI and onboarding

## License

No license has been added yet.

