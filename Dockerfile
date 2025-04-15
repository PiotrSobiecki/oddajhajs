FROM node:18-alpine

WORKDIR /app

# Kopiuj pliki package.json i package-lock.json
COPY package*.json ./

# Kopiuj katalog prisma
COPY prisma ./prisma/

# Kopiuj skrypty pomocnicze
COPY healthcheck.js ./

# Instaluj zależności - dodajemy --production=false, aby zainstalować także devDependencies
RUN npm ci --production=false

# Generuj typy Prisma
RUN npx prisma generate

# Kopiuj pozostałe pliki
COPY . .

# Zmienne środowiskowe
ENV NODE_ENV production
ENV PORT 3000

# Wyświetl informacje o zmiennych środowiskowych podczas budowania (bez uwzględnienia wartości)
RUN echo "Zmienne środowiskowe, które będą użyte podczas budowania:"
RUN printenv | grep -E "^(GOOGLE_|NEXTAUTH_|DATABASE_)" || echo "Brak zmiennych środowiskowych"

# Usuń plik .env.production, aby upewnić się, że używane są zmienne środowiskowe
RUN rm -f .env.production && echo "Usunięto .env.production, aby używać zmiennych środowiskowych z Railway"

# Buduj aplikację
RUN npm run build

# Eksponuj port
EXPOSE 3000

# Skrypt entrypoint dla bezpiecznego uruchamiania aplikacji
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Uruchamianie aplikacji..."' >> /app/entrypoint.sh && \
    echo 'echo "Sprawdzanie zmiennych środowiskowych:"' >> /app/entrypoint.sh && \
    echo 'env | grep -E "^(GOOGLE_|NEXTAUTH_|DATABASE_)" || echo "Brak zmiennych środowiskowych"' >> /app/entrypoint.sh && \
    echo 'node /app/healthcheck.js' >> /app/entrypoint.sh && \
    echo 'echo "Uruchamianie migracji..."' >> /app/entrypoint.sh && \
    echo 'npx prisma migrate deploy' >> /app/entrypoint.sh && \
    echo 'echo "Uruchamianie serwera..."' >> /app/entrypoint.sh && \
    echo 'npm start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Komenda startowa
CMD ["/app/entrypoint.sh"] 