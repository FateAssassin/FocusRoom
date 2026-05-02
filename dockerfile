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

# Build Next.js
RUN pnpm build

# Expose port
EXPOSE 3000

# create DB automatically
RUN node app/lib/db/create-db.js || true

# Run the app
CMD ["pnpm", "start"]