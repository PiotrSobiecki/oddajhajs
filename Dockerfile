FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Instaluj zależności
RUN npm ci

# Kopiuj pozostałe pliki
COPY . .

# Generuj typy Prisma
RUN npx prisma generate

# Buduj aplikację
RUN npm run build

# Zmienna środowiskowa
ENV NODE_ENV production
ENV PORT 3000

# Eksponuj port
EXPOSE 3000

# Uruchom migracje i aplikację
CMD npx prisma migrate deploy && npm start 