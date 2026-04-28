# Next.js 14 standalone — 빌드 컨텍스트는 레포 루트( docker compose 의 context: ../.. )
#   cd deploy/rocky && docker compose -f docker-compose.yml -f docker-compose.app.yml build app

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# SSG/Prisma — next build 가 DB에 붙는 화면이 있음. 런타임은 .env.app (compose)와 별개
# 빌드 머신에서 호스트의 Postgres( compose 로 띄운 127.0.0.1:5432 )에 닿을 수 있어야 함
# docker-compose.app.yml 에서 host.docker.internal + build args로 전달
ARG BUILD_DATABASE_URL
ARG BUILD_DIRECT_URL
ENV DATABASE_URL=$BUILD_DATABASE_URL
ENV DIRECT_URL=$BUILD_DIRECT_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 런타임 DB/스토리지 URL은 compose env_file(.env.app) — 빌드용 DATABASE_URL는 이미지에 남기지 않음

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
