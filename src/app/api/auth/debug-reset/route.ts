import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Ta funkcja czyści wszystkie cookies związane z sesją i wyświetla informacje diagnostyczne
export async function GET(request: Request) {
  const cookieStore = cookies();
  const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  // Licznik usuniętych cookies
  let deletedCount = 0;
  const deletedCookies: string[] = [];

  // Usuń wszystkie cookies związane z next-auth
  for (const name of cookieNames) {
    if (name.includes("next-auth")) {
      cookieStore.delete(name);
      deletedCount++;
      deletedCookies.push(name);
    }
  }

  // Przygotuj URL do przekierowania na Google OAuth
  const detectedUrl = new URL(request.url).origin;
  const configuredUrl = process.env.NEXTAUTH_URL || "";

  // ZAWSZE używaj NEXTAUTH_URL zamiast wykrytego URL
  const baseUrl = configuredUrl || detectedUrl;

  const callbackUrl = `${baseUrl}/api/auth/callback/google`;
  const googleSignInUrl = `${baseUrl}/api/auth/signin/google?callbackUrl=/dashboard&reset=true`;

  // Log dla diagnostyki
  console.log("Debug Reset - detectedUrl:", detectedUrl);
  console.log("Debug Reset - configuredUrl:", configuredUrl);
  console.log("Debug Reset - użyty baseUrl:", baseUrl);

  // Zbierz informacje o zmiennych środowiskowych (bezpiecznie)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || "nie ustawione",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "ustawione" : "nie ustawione",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
      ? "ustawione"
      : "nie ustawione",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? "ustawione"
      : "nie ustawione",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      ? "ustawione"
      : "nie ustawione",
    NEXT_PUBLIC_NEXTAUTH_URL:
      process.env.NEXT_PUBLIC_NEXTAUTH_URL || "nie ustawione",
    VERCEL_URL: process.env.VERCEL_URL || "nie ustawione",
    VERCEL_ENV: process.env.VERCEL_ENV || "nie ustawione",
  };

  // Sprawdź, czy konfiguracja Google jest poprawna
  const googleCheck = {
    clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    expectedRedirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    detectedOrigin: baseUrl,
    detectedCallback: callbackUrl,
  };

  // Odpowiedź z informacją i przekierowaniem
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
    <head>
      <title>Diagnostyka sesji</title>
      <meta http-equiv="refresh" content="30;url=${googleSignInUrl}">
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .container { background: #f0f0f0; padding: 20px; border-radius: 10px; }
        .info-section { margin-top: 20px; background: #e0e0e0; padding: 15px; border-radius: 5px; }
        .btn { display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .btn-secondary { background: #34a853; }
        .cookie-list { font-family: monospace; background: #d0d0d0; padding: 10px; border-radius: 5px; }
        .env-list { font-family: monospace; background: #d0d0d0; padding: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Diagnostyka sesji i logowania</h1>
        
        <div class="info-section">
          <h2>Resetowanie sesji</h2>
          <p>Usunięto ${deletedCount} cookies związanych z sesją:</p>
          <div class="cookie-list">
            ${
              deletedCookies.map((c) => `<div>${c}</div>`).join("") ||
              "<div>Brak cookies do usunięcia</div>"
            }
          </div>
        </div>
        
        <div class="info-section">
          <h2>Zmienne środowiskowe</h2>
          <p>Najważniejsze zmienne środowiskowe potrzebne do poprawnego działania NextAuth:</p>
          <div class="env-list">
            ${Object.entries(envInfo)
              .map(
                ([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`
              )
              .join("")}
          </div>
        </div>

        <div class="info-section">
          <h2>Konfiguracja Google OAuth</h2>
          <p>Szczegóły konfiguracji Google OAuth:</p>
          <div class="env-list">
            ${Object.entries(googleCheck)
              .map(
                ([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`
              )
              .join("")}
          </div>
        </div>

        <div class="info-section">
          <h2>Co dalej?</h2>
          <p>Za 30 sekund zostaniesz przekierowany na stronę logowania Google...</p>
          <p>Jeśli logowanie wciąż nie działa, sprawdź:</p>
          <ul>
            <li>Czy w konsoli Google Cloud API włączony jest OAuth 2.0</li>
            <li>Czy domena <code>${baseUrl}</code> jest autoryzowana w konsoli Google</li>
            <li>Czy poprawny adres callback <code>${baseUrl}/api/auth/callback/google</code> jest ustawiony</li>
            <li>Czy zmienne środowiskowe są poprawnie ustawione w projekcie</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px;">
          <a class="btn" href="${googleSignInUrl}">Zaloguj się przez Google</a>
          <a class="btn btn-secondary" href="/login" style="margin-left: 10px;">Wróć do logowania</a>
        </div>
      </div>
    </body>
    </html>`,
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
