FROM node:18-alpine

WORKDIR /app

# Kopiowanie plików projektu
COPY . .

# Instalacja zależności
RUN npm install

# Budowanie aplikacji
RUN npm run build

# Konfiguracja uruchomieniowa
EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"] 