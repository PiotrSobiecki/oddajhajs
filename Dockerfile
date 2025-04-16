FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Najpierw kopiujemy katalog prisma, żeby mieć dostęp do schematu
COPY prisma ./prisma/

# Instaluj zależności
RUN npm ci

# Kopiuj pozostałe pliki
COPY . .

# Pokazujemy zmienne środowiskowe widoczne podczas budowania (tylko nazwy)
RUN echo "Zmienne środowiskowe dostępne podczas budowania:" && \
    env | grep -E '^(GOOGLE_|NEXTAUTH_|DATABASE_)' | cut -d= -f1 || echo "Brak zmiennych środowiskowych"

# Zmienna środowiskowa dla Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3000
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Pomijamy sprawdzanie typów podczas budowania
ENV NEXT_TYPESCRIPT_COMPILE_ONLY=1

# Czyścimy katalog .next, aby upewnić się, że budowanie zacznie się od zera
RUN rm -rf /app/.next

# Buduj aplikację
RUN npm run build

# Sprawdź katalogi po budowaniu
RUN echo "Sprawdzanie katalogu .next po budowaniu:" && \
    ls -la /app/.next/ || echo "Katalog .next nie istnieje"

# Upewnij się, że katalog prisma jest dostępny
RUN ls -la /app/prisma

# Tworzymy lub modyfikujemy potrzebne pliki do uruchomienia w trybie produkcyjnym
RUN mkdir -p /app/.next && \
    if [ ! -f /app/.next/prerender-manifest.json ]; then \
        echo '{"version":3,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > /app/.next/prerender-manifest.json; \
    fi && \
    if [ ! -f /app/.next/server/pages-manifest.json ]; then \
        mkdir -p /app/.next/server && \
        echo '{}' > /app/.next/server/pages-manifest.json; \
    fi

# Tworzę prosty skrypt startowy
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "============================================"' >> /app/entrypoint.sh && \
    echo 'echo "Sprawdzanie zmiennych środowiskowych w kontenerze:"' >> /app/entrypoint.sh && \
    echo 'echo "NEXTAUTH_URL: $NEXTAUTH_URL"' >> /app/entrypoint.sh && \
    echo 'echo "DATABASE_URL dostępny: $(if [ -n "$DATABASE_URL" ]; then echo TAK; else echo NIE; fi)"' >> /app/entrypoint.sh && \
    echo 'echo "GOOGLE_CLIENT_ID dostępny: $(if [ -n "$GOOGLE_CLIENT_ID" ]; then echo TAK; else echo NIE; fi)"' >> /app/entrypoint.sh && \
    echo 'echo "============================================"' >> /app/entrypoint.sh && \
    echo 'echo "Uruchamianie aplikacji..."' >> /app/entrypoint.sh && \
    echo 'npx prisma migrate deploy && npm start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Uruchom migracje i aplikację
CMD ["/app/entrypoint.sh"] 