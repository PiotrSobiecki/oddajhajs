# Etap bazowy
FROM node:18-alpine AS base
WORKDIR /app

# Ustawiam zmienne środowiskowe, aby wyłączyć telemetrię i sprawdzanie typów
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_SKIP_TYPESCRIPT_CHECK 1

# Etap instalacji zależności
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Etap budowania
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generowanie klienta Prisma i budowanie aplikacji
RUN npx prisma generate

# Użycie skryptu docker-build zamiast zwykłego build
RUN npm run docker-build

# Etap produkcyjny
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Utworzenie nieprivilegowanego użytkownika
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiowanie niezbędnych plików
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Ustawienie uprawnień dla nextjs użytkownika
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000

# Komenda startowa
CMD ["node", "server.js"] 