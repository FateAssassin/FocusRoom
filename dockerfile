FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy lockfiles first (for caching)
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy rest of the app
COPY . .

# Build Next.js
RUN pnpm build

# Create data + uploads folders
RUN mkdir -p /app/data
RUN mkdir -p /app/public/uploads/profile-pictures

# Expose port
EXPOSE 3000

# Start your custom server
CMD ["pnpm", "start"]