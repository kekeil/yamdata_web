# syntax=docker.io/docker/dockerfile:1

# Build stage
FROM node:18-alpine AS builder

# Utilities
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies (no lockfile required)
COPY package.json ./
RUN npm install

# Copy source and build
COPY . ./
RUN npm run build


# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy built artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Launch the Next.js standalone server
CMD ["node", "server.js"]
