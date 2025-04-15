FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Najpierw kopiujemy katalog prisma, żeby mieć dostęp do schematu
COPY prisma ./prisma/

# Kopiuj plik .env.production do użycia podczas budowania
COPY .env.production ./

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

# Eksponuj port
EXPOSE 3000

# Skrypt pomocniczy do sprawdzania zmiennych środowiskowych przed uruchomieniem aplikacji
RUN echo '#!/bin/sh \n\
echo "\n\n============================================" \n\
echo "Sprawdzanie zmiennych środowiskowych w kontenerze:" \n\
echo "============================================" \n\
echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:0:10}... (długość: ${#GOOGLE_CLIENT_ID})" \n\
echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:0:5}... (długość: ${#GOOGLE_CLIENT_SECRET})" \n\
echo "NEXTAUTH_URL=${NEXTAUTH_URL}" \n\
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:0:5}... (długość: ${#NEXTAUTH_SECRET})" \n\
echo "DATABASE_URL=${DATABASE_URL:0:15}... (długość: ${#DATABASE_URL})" \n\
echo "\nWszystkie zmienne środowiskowe związane z Google, NextAuth i DB:" \n\
env | grep -E "^(GOOGLE_|NEXTAUTH_|DATABASE_)" || echo "Brak zmiennych środowiskowych" \n\
echo "============================================\n\n" \n\
echo "Uruchamianie aplikacji..." \n\
npx prisma migrate deploy && npm start' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Uruchom migracje i aplikację
CMD ["/app/entrypoint.sh"] 