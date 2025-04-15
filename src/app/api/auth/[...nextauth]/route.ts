import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("Auth Route - Inicjalizacja API Route NextAuth");

// Funkcja pomocnicza do usuwania cudzysłowów ze zmiennych środowiskowych
function cleanEnv(value: string | undefined): string {
  if (!value) return "";

  // Usuń cudzysłowy z początku i końca
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

// Sprawdzamy zmienne środowiskowe
const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL);
console.log(`Auth Route - NEXTAUTH_URL po oczyszczeniu: "${nextAuthUrl}"`);

const handler = NextAuth(authOptions);

// Pomocnicza funkcja do analizy URL
function parseUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      hash: url.hash,
    };
  } catch (error) {
    return { error: `Nieprawidłowy URL: ${urlString}` };
  }
}

// Dodajmy funkcję pomocniczą do monitorowania zapytań
const wrappedHandler = async (req: Request, ...args: any[]) => {
  const url = new URL(req.url);
  console.log(
    `Auth Route - ${req.method} zapytanie: ${url.pathname}${url.search}`
  );

  // Analiza URL
  console.log("Auth Route - Szczegóły URL:", parseUrl(req.url));

  // Jeśli URL zawiera callback, dodaj szczegółowe debugowanie
  if (url.pathname.includes("/callback")) {
    console.log("Auth Route - Debugowanie callbacka:");
    console.log("  - Pełny URL:", req.url);
    console.log("  - Parametry:", Object.fromEntries(url.searchParams));

    // Próba odczytania ciasteczek z zapytania
    const cookieHeader = req.headers.get("cookie");
    console.log("  - Cookie Header:", cookieHeader);

    // Sprawdzamy, czy mamy token stanu OAuth
    const stateParam = url.searchParams.get("state");
    console.log("  - OAuth state param:", stateParam);

    // Sprawdzamy, czy mamy kod autoryzacji OAuth
    const codeParam = url.searchParams.get("code");
    console.log(
      "  - OAuth code param:",
      codeParam ? "Dostępny (długość: " + codeParam.length + ")" : "Brak"
    );

    // Sprawdzamy, czy mamy błąd OAuth
    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      console.error("  - OAuth ERROR:", errorParam);
      console.error(
        "  - OAuth error_description:",
        url.searchParams.get("error_description")
      );
    }
  }

  try {
    // Wywołanie oryginalnego handlera
    console.log("Auth Route - Wywołuję handler NextAuth...");
    const response = await (handler as any)(req, ...args);
    console.log(`Auth Route - Odpowiedź wysłana: ${response.status}`);

    // Jeśli to przekierowanie, analizujemy URL
    if (response.status === 302 || response.status === 307) {
      const redirectUrl = response.headers.get("location");
      console.log(`Auth Route - Przekierowanie na: ${redirectUrl}`);
      console.log(
        "Auth Route - Szczegóły przekierowania:",
        parseUrl(redirectUrl || "")
      );
    }

    return response;
  } catch (error) {
    console.error("Auth Route - BŁĄD KRYTYCZNY:", error);
    // Wyświetlmy więcej szczegółów o błędzie
    if (error instanceof Error) {
      console.error("  - Nazwa błędu:", error.name);
      console.error("  - Komunikat:", error.message);
      console.error("  - Stack:", error.stack);

      // Sprawdź typy błędów OAuth
      if (
        error.message.includes("callback") ||
        error.message.includes("OAuth") ||
        error.message.includes("google")
      ) {
        console.error("  - To jest błąd OAuth!");
        console.error(
          "  - Sprawdź konfigurację Google OAuth w konsoli Google Cloud."
        );
        console.error(
          `  - Upewnij się, że callback URL jest ustawiony na: ${nextAuthUrl}/api/auth/callback/google`
        );

        // Więcej szczegółów i diagnostyka
        console.error("  - Dodatkowa diagnostyka:");
        console.error(
          `    - Czy NEXTAUTH_URL ustawiony: ${!!process.env.NEXTAUTH_URL}`
        );
        console.error(
          `    - Czy GOOGLE_CLIENT_ID ustawiony: ${!!process.env
            .GOOGLE_CLIENT_ID}`
        );
        console.error(
          `    - Czy GOOGLE_CLIENT_SECRET ustawiony: ${!!process.env
            .GOOGLE_CLIENT_SECRET}`
        );
        console.error(`    - NODE_ENV: ${process.env.NODE_ENV}`);
      }
    }

    // Zapewniamy, że użytkownik dostanie informację o błędzie z pełnymi szczegółami
    const errorDetails =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    // Przekieruj do strony logowania z błędem
    console.log("Auth Route - Przekierowuję na stronę logowania z błędem.");

    return Response.redirect(
      `${nextAuthUrl}/login?error=Callback&details=${encodeURIComponent(
        errorDetails
      )}`
    );
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
