# syntax=docker/dockerfile:1

# --- Base: Node + pnpm (via corepack) ---------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- Dependencies (cached layer) --------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build: generate the Pokédex index (from PokéAPI) + compile Next ---------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `pnpm build` runs the `prebuild` hook first (scripts/build-pokedex.ts),
# then `next build` with output: "standalone".
RUN pnpm build

# --- Runner: minimal standalone image ---------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The generated index is read at runtime with fs (see src/lib/pokedex/index.ts).
COPY --from=builder --chown=nextjs:nodejs /app/src/data/pokedex.generated.json ./src/data/pokedex.generated.json

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
