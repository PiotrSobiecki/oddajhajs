FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Najpierw kopiujemy katalog prisma, żeby mieć dostęp do schematu
COPY prisma ./prisma/

# Instaluj zależności
RUN npm ci

# Generuj typy Prisma
RUN npx prisma generate

# Kopiuj pozostałe pliki
COPY . .

# Zmienna środowiskowa dla Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV PORT 3000

# Buduj aplikację
# Uwaga: Podczas budowania aplikacja nie ma dostępu do zmiennych środowiskowych Railway
RUN npm run build

# Upewnij się, że katalog prisma jest dostępny
RUN ls -la /app/prisma/

# Eksponuj port
EXPOSE 3000

# Skrypt pomocniczy do sprawdzania zmiennych środowiskowych przed uruchomieniem aplikacji
RUN echo '#!/bin/sh \n\
echo "Sprawdzanie zmiennych środowiskowych..." \n\
echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" \n\
echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:0:5}..." \n\
echo "NEXTAUTH_URL=$NEXTAUTH_URL" \n\
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:0:5}..." \n\
echo "DATABASE_URL=${DATABASE_URL:0:15}..." \n\
echo "Uruchamianie aplikacji..." \n\
npx prisma migrate deploy && npm start' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Uruchom migracje i aplikację
CMD ["/app/entrypoint.sh"] 