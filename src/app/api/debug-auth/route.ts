import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";

// Funkcja pomocnicza do usuwania cudzysłowów
function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headersList = headers();

  // Pobierz aktualną sesję
  const session = await getServerSession(authOptions);

  // Zmienne środowiskowe
  const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL);
  const googleClientId = process.env.GOOGLE_CLIENT_ID
    ? process.env.GOOGLE_CLIENT_ID.substring(0, 5) + "..."
    : undefined;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    ? process.env.GOOGLE_CLIENT_SECRET.substring(0, 3) + "..."
    : undefined;

  // Adresy przekierowania
  const expectedCallback = `${nextAuthUrl}/api/auth/callback/google`;
  const expectedSignIn = `${nextAuthUrl}/api/auth/signin/google`;

  // Sprawdź integralność zmiennych środowiskowych
  const envIntegrity = {
    nextAuthUrlPresent: !!nextAuthUrl,
    nextAuthUrlIsHttps: nextAuthUrl.startsWith("https://"),
    googleClientIdPresent: !!googleClientId,
    googleClientSecretPresent: !!googleClientSecret,
  };

  // Przygotuj odpowiedź
  const debugInfo = {
    timestamp: new Date().toISOString(),
    session: session
      ? {
          exists: true,
          user: session.user
            ? {
                id: session.user.id,
                email: session.user.email,
              }
            : null,
        }
      : { exists: false },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      nextAuthUrl,
      googleClientIdPrefix: googleClientId,
      googleClientSecretPrefix: googleClientSecret,
    },
    expectedUrls: {
      callback: expectedCallback,
      signIn: expectedSignIn,
    },
    envIntegrity,
    requestInfo: {
      url: request.url,
      headers: Object.fromEntries(headersList.entries()),
    },
    instructionsHtml: `
      <h2>Instrukcje debugowania logowania Google</h2>
      <ol>
        <li>Upewnij się, że NEXTAUTH_URL jest ustawione na <code>https://oddajhajs.org</code></li>
        <li>Sprawdź, czy w Google Cloud Console masz skonfigurowany adres przekierowania: <code>${expectedCallback}</code></li>
        <li>Wyloguj się i zaloguj ponownie</li>
        <li>Sprawdź, czy używasz HTTPS, a nie HTTP</li>
        <li>Wyczyść pamięć podręczną przeglądarki</li>
      </ol>
    `,
  };

  return NextResponse.json(debugInfo);
}
