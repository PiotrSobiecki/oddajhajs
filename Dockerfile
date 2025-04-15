FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Najpierw kopiujemy katalog prisma, żeby mieć dostęp do schematu
COPY prisma ./prisma/

# Kopiuj plik .env.production do użycia podczas budowania
COPY .env.production ./

# Kopiuj skrypt startowy
COPY start.sh ./

# Instaluj zależności
RUN npm ci

# Generuj typy Prisma
RUN npx prisma generate

# Kopiuj pozostałe pliki
COPY . .

# Pokazujemy zmienne środowiskowe widoczne podczas budowania (tylko nazwy)
RUN echo "Zmienne środowiskowe dostępne podczas budowania:" && \
    env | grep -E '^(GOOGLE_|NEXTAUTH_|DATABASE_)' | cut -d= -f1 || echo "Brak zmiennych środowiskowych"

# Zmienna środowiskowa dla Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3000

# Buduj aplikację (używa .env.production)
RUN npm run build

# Upewnij się, że katalog prisma jest dostępny
RUN ls -la /app/prisma/

# Nadaj uprawnienia wykonywania dla skryptu startowego
RUN chmod +x /app/start.sh

# Eksponuj port
EXPOSE 3000

# Utwórz skrypt, który wyświetli redirect_uri używany przez NextAuth 
RUN echo '#!/bin/sh' > /app/show-redirect.sh && \
    echo 'echo "NEXTAUTH_URL: $NEXTAUTH_URL"' >> /app/show-redirect.sh && \
    echo 'echo "Callback URL: ${NEXTAUTH_URL}/api/auth/callback/google"' >> /app/show-redirect.sh && \
    chmod +x /app/show-redirect.sh && \
    cat /app/show-redirect.sh

# Uruchom migracje i aplikację - wcześniej wyświetl informacje o callback URL
CMD /app/show-redirect.sh && /app/start.sh 