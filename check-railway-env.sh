#!/bin/bash

# Ten skrypt pozwala sprawdzić zmienne środowiskowe bezpośrednio w Railway
# Uruchom go za pomocą polecenia: railway run ./check-railway-env.sh

echo "=============================================="
echo "   Sprawdzanie zmiennych środowiskowych Railway"
echo "=============================================="

echo ""
echo "ZMIENNE GOOGLE AUTH:"
echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:0:10}..."
echo "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:0:5}..."
echo "Długość GOOGLE_CLIENT_ID: ${#GOOGLE_CLIENT_ID}"
echo "Długość GOOGLE_CLIENT_SECRET: ${#GOOGLE_CLIENT_SECRET}"

echo ""
echo "ZMIENNE NEXTAUTH:"
echo "NEXTAUTH_URL=$NEXTAUTH_URL"
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:0:5}..."
echo "Długość NEXTAUTH_SECRET: ${#NEXTAUTH_SECRET}"

echo ""
echo "ZMIENNE BAZY DANYCH:"
echo "DATABASE_URL=${DATABASE_URL:0:15}..."
echo "Długość DATABASE_URL: ${#DATABASE_URL}"

echo ""
echo "WSZYSTKIE ZMIENNE ŚRODOWISKOWE RAILWAY:"
env | grep -E "^(RAILWAY_|DATABASE_URL|NEXTAUTH_|GOOGLE_)" | sort

echo ""
echo "=============================================="
echo "   Koniec sprawdzania zmiennych środowiskowych"
echo "==============================================" 