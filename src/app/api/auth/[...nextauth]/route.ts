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
    console.log("  - Headers:", Object.fromEntries(req.headers));
  }

  try {
    // Wywołanie oryginalnego handlera
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
    console.error("Auth Route - BŁĄD:", error);
    // Wyświetlmy więcej szczegółów o błędzie
    if (error instanceof Error) {
      console.error("  - Nazwa błędu:", error.name);
      console.error("  - Komunikat:", error.message);
      console.error("  - Stack:", error.stack);
    }
    throw error;
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
