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

# Buduj aplikację
RUN npm run build

# Zmienna środowiskowa
ENV NODE_ENV production
ENV PORT 3000

# Upewnij się, że katalog prisma jest dostępny
RUN ls -la /app/prisma/

# Eksponuj port
EXPOSE 3000

# Uruchom migracje i aplikację
CMD npx prisma migrate deploy && npm start 