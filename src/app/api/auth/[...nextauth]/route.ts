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
  // Naprawiamy problem z baseUrl
  const origUrl = new URL(req.url);

  // Sprawdzam czy to nie jest request związany z Google OAuth callback
  const isCallback = origUrl.pathname.includes("/callback/google");
  const isSignIn = origUrl.pathname.includes("/signin/google");

  // Zwiększamy poziom logowania dla tych ścieżek
  if (isCallback || isSignIn) {
    console.log(`Auth Route - Ważne zapytanie OAuth: ${origUrl.pathname}`);
  }

  console.log(
    `Auth Route - ${req.method} zapytanie: ${origUrl.pathname}${origUrl.search}`
  );

  // Pobierz nagłówki X-Forwarded-* stosowane przez Railway
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  let detectedUrl = "";

  if (forwardedProto && forwardedHost) {
    detectedUrl = `${forwardedProto}://${forwardedHost}`;
    console.log(`Auth Route - Wykryto przekierowany URL: ${detectedUrl}`);

    // Nadpisz URL w żądaniu, aby NextAuth otrzymał poprawny adres
    if (isCallback || isSignIn) {
      // Tworzymy nowy obiekt URL ze skorygowanym hostem
      const fixedUrl = new URL(origUrl.toString());
      fixedUrl.protocol = forwardedProto;
      fixedUrl.host = forwardedHost;

      // Modyfikujemy żądanie, aby użyć poprawnego URL
      console.log(
        `Auth Route - Naprawiam URL żądania z ${origUrl} na ${fixedUrl}`
      );

      // Tworzenie nowego obiektu Request z poprawnym URL
      const modifiedReq = new Request(fixedUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        cache: req.cache,
        credentials: req.credentials,
        integrity: req.integrity,
        keepalive: req.keepalive,
        mode: req.mode,
        redirect: req.redirect,
        referrer: req.referrer,
        referrerPolicy: req.referrerPolicy,
        signal: req.signal,
      });

      // Zastępujemy oryginalne żądanie
      req = modifiedReq;
      console.log(
        `Auth Route - Żądanie zostało zmodyfikowane. Nowy URL: ${req.url}`
      );
    }

    // Nadpisz NEXTAUTH_URL w czasie wykonania, jeśli nie jest ustawiony
    if (!process.env.NEXTAUTH_URL) {
      console.log(
        `Auth Route - Ustawiam tymczasowo NEXTAUTH_URL na ${detectedUrl}`
      );
      process.env.NEXTAUTH_URL = detectedUrl;
    }
  }

  // Analiza URL
  console.log("Auth Route - Szczegóły URL:", parseUrl(req.url));
  console.log("Auth Route - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
  console.log("Auth Route - Wykryty URL:", detectedUrl);

  // Jeśli URL zawiera callback, dodaj szczegółowe debugowanie
  if (origUrl.pathname.includes("/callback")) {
    console.log("Auth Route - Debugowanie callbacka:");
    console.log("  - Pełny URL:", req.url);
    console.log("  - Parametry:", Object.fromEntries(origUrl.searchParams));

    // Próba odczytania ciasteczek z zapytania
    const cookieHeader = req.headers.get("cookie");
    console.log("  - Cookie Header:", cookieHeader);

    // Sprawdzamy, czy mamy token stanu OAuth
    const stateParam = origUrl.searchParams.get("state");
    console.log("  - OAuth state param:", stateParam);

    // Sprawdzamy, czy mamy kod autoryzacji OAuth
    const codeParam = origUrl.searchParams.get("code");
    console.log(
      "  - OAuth code param:",
      codeParam ? "Dostępny (długość: " + codeParam.length + ")" : "Brak"
    );

    // Sprawdzamy, czy mamy błąd OAuth
    const errorParam = origUrl.searchParams.get("error");
    if (errorParam) {
      console.error("  - OAuth ERROR:", errorParam);
      console.error(
        "  - OAuth error_description:",
        origUrl.searchParams.get("error_description")
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
        error.message.includes("google") ||
        error.message.includes("PKCE")
      ) {
        console.error("  - To jest błąd OAuth!");
        console.error(
          "  - Sprawdź konfigurację Google OAuth w konsoli Google Cloud."
        );
        console.error(
          `  - Upewnij się, że callback URL jest ustawiony na: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`
        );
        console.error(
          `  - Aktualny URL wykryty z nagłówków: ${detectedUrl}/api/auth/callback/google`
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

        // Sprawdź stan sesji w cookies
        const cookieHeader = req.headers.get("cookie");
        if (cookieHeader) {
          console.error("  - Cookies w żądaniu:");
          cookieHeader.split(";").forEach((cookie) => {
            const [name, value] = cookie.trim().split("=");
            if (name.includes("next-auth")) {
              console.error(`    - ${name}: ${value.substring(0, 10)}...`);
            }
          });
        } else {
          console.error("  - Brak cookies w żądaniu!");
        }
      }
    }

    // Zapewniamy, że użytkownik dostanie informację o błędzie z pełnymi szczegółami
    const errorDetails =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    // Przekieruj do strony logowania z błędem
    console.log("Auth Route - Przekierowuję na stronę logowania z błędem.");

    // Użyj detectedUrl zamiast nextAuthUrl, jeśli jest dostępny
    const redirectBase = detectedUrl || nextAuthUrl || "https://oddajhajs.org";

    return Response.redirect(
      `${redirectBase}/login?error=Callback&details=${encodeURIComponent(
        errorDetails
      )}`
    );
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
