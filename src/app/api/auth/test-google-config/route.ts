import { NextResponse } from "next/server";
import GoogleProvider from "next-auth/providers/google";

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
  // Pobierz zmienne środowiskowe
  const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL);
  const googleClientId = cleanEnv(process.env.GOOGLE_CLIENT_ID || "");
  const googleClientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET || "");

  // Sprawdzenie zmiennych środowiskowych
  const envCheck = {
    nextAuthUrl: {
      value: nextAuthUrl,
      valid:
        !!nextAuthUrl &&
        (nextAuthUrl.startsWith("https://") ||
          nextAuthUrl.startsWith("http://")),
    },
    googleClientId: {
      present: !!googleClientId,
      length: googleClientId.length,
      preview: googleClientId.substring(0, 5) + "...",
      valid: googleClientId.length > 20,
    },
    googleClientSecret: {
      present: !!googleClientSecret,
      length: googleClientSecret.length,
      preview: googleClientSecret.substring(0, 3) + "...",
      valid: googleClientSecret.length > 10,
    },
  };

  // Sprawdźmy konfigurację callbacka
  const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;

  // Próba bezpośredniego wygenerowania URL OAuth
  let authUrl = "";
  let providerError = null;

  try {
    const provider = GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    });

    // Próba wygenerowania URL autoryzacji
    if (
      typeof provider.authorization === "object" &&
      provider.authorization.url
    ) {
      const url = new URL(provider.authorization.url);
      url.searchParams.append("client_id", googleClientId);
      url.searchParams.append("redirect_uri", callbackUrl);
      url.searchParams.append("response_type", "code");
      url.searchParams.append("scope", "openid profile email");

      authUrl = url.toString();
    }
  } catch (error) {
    if (error instanceof Error) {
      providerError = {
        message: error.message,
        stack: error.stack,
      };
    } else {
      providerError = { message: "Nieznany błąd" };
    }
  }

  // Przygotuj odpowiedź
  const response = {
    timestamp: new Date().toISOString(),
    environment: envCheck,
    callback: {
      url: callbackUrl,
      isHttps: callbackUrl.startsWith("https://"),
    },
    authUrl: authUrl || null,
    error: providerError,
    htmlInstructions: `
      <h2>Instrukcje dla konfiguracji Google OAuth</h2>
      <ol>
        <li>Upewnij się, że w Google Cloud Console masz skonfigurowany <b>dokładnie</b> ten adres przekierowania: <code>${callbackUrl}</code></li>
        <li>Sprawdź, czy ID klienta i sekret są poprawne</li>
        <li>Upewnij się, że Twój adres email jest na liście testowych użytkowników (jeśli aplikacja jest w trybie testowym)</li>
        <li>Sprawdź, czy aplikacja OAuth jest włączona w Google Cloud Console</li>
      </ol>
      
      <h3>Rozwiązywanie problemów</h3>
      <p>Jeśli wszystko wygląda poprawnie, spróbuj poniższego linku do bezpośredniego zalogowania przez Google:</p>
      ${
        authUrl
          ? `<a href="${authUrl}" style="display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Zaloguj się przez Google (URL bezpośredni)</a>`
          : "<p>Nie można wygenerować URL autoryzacji</p>"
      }
    `,
  };

  return NextResponse.json(response);
}
