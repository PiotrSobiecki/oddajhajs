FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ustawienie zmiennej środowiskowej dla Prisma
# Używamy URL dla PostgreSQL jako zmiennej systemowej, którą można nadpisać
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/oddajhajs?schema=public"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="IeKs/7zAArLqn1dEVefNq8nMs+Z46dgQG/ZtOisFp64="

# Najpierw generowanie prisma
RUN npx prisma generate

# Debugujemy proces budowania
RUN echo "Building Next.js app..."

# Build with TypeScript checking disabled
ENV NEXT_TELEMETRY_DISABLED 1
ENV TYPESCRIPT_SKIP_TYPECHECKING 1
ENV NODE_ENV production
RUN npm run docker-build || (echo "Build failed" && cat .next/error.log && exit 1)

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# DATABASE_URL będzie pobierany z zmiennych środowiskowych kontenera
ENV DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/oddajhajs?schema=public}
# NEXTAUTH_URL będzie pobierany z zmiennych środowiskowych kontenera
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
ENV NEXTAUTH_SECRET="IeKs/7zAArLqn1dEVefNq8nMs+Z46dgQG/ZtOisFp64="

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Kopiujemy wygenerowane pliki Prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 