#!/bin/sh

# Sprawdź zmienne środowiskowe
echo "======================================"
echo "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:5}... (length: ${#GOOGLE_CLIENT_ID})"
echo "GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:3}... (length: ${#GOOGLE_CLIENT_SECRET})"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:3}... (length: ${#NEXTAUTH_SECRET})"
echo "======================================"

# Migracja bazy danych i uruchomienie aplikacji
npx prisma migrate deploy
npm start 