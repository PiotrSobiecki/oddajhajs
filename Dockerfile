FROM node:18-alpine

WORKDIR /app

# Kopiowanie plików projektu
COPY package.json package-lock.json ./
RUN npm install

# Kopiowanie pozostałych plików
COPY . .

# Zmienne środowiskowe dla etapu budowania
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_TYPE_CHECK=1

# Budowanie aplikacji z pominięciem sprawdzania typów i lintowania
RUN npm run build -- --no-lint

# Konfiguracja uruchomieniowa
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"] 