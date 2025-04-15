# OddajHajs.org

Aplikacja do rozliczeń między znajomymi z wyjazdów, imprez i innych wspólnych wydarzeń.

## Wdrożenie na Railway

Aby wdrożyć aplikację na Railway z działającym logowaniem przez Google, wykonaj poniższe kroki:

### 1. Przygotowanie projektu

1. Sklonuj repozytorium
2. Upewnij się, że masz zainstalowany [Railway CLI](https://docs.railway.app/develop/cli)
3. Zaloguj się do Railway: `railway login`

### 2. Konfiguracja bazy danych

1. Utwórz nowy projekt na Railway
2. Dodaj usługę PostgreSQL do projektu
3. Skopiuj URL połączenia do bazy danych

### 3. Konfiguracja Google OAuth

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Przejdź do "APIs & Services" > "Credentials"
4. Kliknij "Create Credentials" > "OAuth client ID"
5. Wybierz typ aplikacji "Web application"
6. Dodaj następujące adresy URL do "Authorized JavaScript origins":
   - `https://twoja-domena.up.railway.app`
7. Dodaj następujące adresy URL do "Authorized redirect URIs":
   - `https://twoja-domena.up.railway.app/api/auth/callback/google`
8. Kliknij "Create" i skopiuj Client ID oraz Client Secret

### 4. Wdrożenie na Railway

1. Inicjalizuj projekt Railway: `railway init`
2. Ustaw zmienne środowiskowe w Railway:

   Wprowadź następujące zmienne środowiskowe dokładnie w takim formacie (bez cudzysłowów i spacji):

   - `DATABASE_URL` - URL połączenia do PostgreSQL
   - `NEXTAUTH_URL` - URL Twojej aplikacji na Railway (np. `https://twoja-domena.up.railway.app`)
   - `NEXTAUTH_SECRET` - bezpieczny ciąg znaków (wygeneruj komendą: `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` - ID klienta Google OAuth
   - `GOOGLE_CLIENT_SECRET` - Secret klienta Google OAuth

   > **UWAGA:** Upewnij się, że wszystkie zmienne środowiskowe są poprawnie ustawione w panelu Railway. Wartości NIE powinny być ujęte w cudzysłowy. Możesz zweryfikować ich status po wdrożeniu, odwiedzając endpoint `/api/check-env`.

3. Wdróż aplikację: `railway up`

### 5. Generowanie schematu Prisma dla produkcji

Jeśli używasz Prisma:

```bash
npx prisma generate
npx prisma db push
```

### 6. Weryfikacja

1. Przejdź do swojej aplikacji na Railway
2. Sprawdź status zmiennych środowiskowych pod adresem: `https://twoja-domena.up.railway.app/api/check-env`
3. Upewnij się, że wszystkie wymagane zmienne są oznaczone jako "Ustawione"
4. Sprawdź, czy logowanie przez Google działa poprawnie

## Rozwiązywanie problemów

### Problem z logowaniem przez Google

Jeśli logowanie przez Google nie działa:

1. Sprawdź, czy URL przekierowania w Google Cloud Console dokładnie odpowiada URLowi Twojej aplikacji
2. Upewnij się, że zmienne środowiskowe GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET są poprawnie ustawione (bez cudzysłowów)
3. Sprawdź status zmiennych środowiskowych pod adresem `/api/check-env`
4. Sprawdź logi aplikacji, aby zobaczyć szczegóły błędów

### Problem z połączeniem do bazy danych

Jeśli występują problemy z bazą danych:

1. Sprawdź, czy zmienna DATABASE_URL jest poprawnie ustawiona
2. Sprawdź, czy schemat bazy danych został poprawnie wygenerowany: `npx prisma db push`

## Lokalne uruchomienie

1. Skopiuj `.env.example` do `.env.local` i uzupełnij zmienne środowiskowe
2. Zainstaluj zależności: `npm install`
3. Uruchom serwer deweloperski: `npm run dev`
