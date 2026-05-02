FROM node:20-alpine

# Build deps for better-sqlite3 (musl has no prebuilt binary)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

ENV DB_PATH=/app/data/focusroom.db

# Copy lockfiles + workspace config first (for caching, and so onlyBuiltDependencies applies)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# Copy rest of the app
COPY . .

# Create data + uploads folders before build (db.ts opens the DB at module load)
RUN mkdir -p /app/data /app/public/uploads/profile-pictures

# Build Next.js (db.ts opens an empty DB; tables are created at container start below)
RUN pnpm build

# Expose port
EXPOSE 3000

# Initialise schema against the (possibly volume-mounted) data dir, then start the server.
# create-db.js uses CREATE TABLE IF NOT EXISTS, so this is safe on every start.
CMD ["sh", "-c", "node app/lib/db/create-db.js && pnpm start"]