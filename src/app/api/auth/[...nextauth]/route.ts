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

// Dodajmy funkcję pomocniczą do monitorowania zapytań
const wrappedHandler = async (req: Request, ...args: any[]) => {
  const url = new URL(req.url);
  console.log(
    `Auth Route - ${req.method} zapytanie: ${url.pathname}${url.search}`
  );

  try {
    // Wywołanie oryginalnego handlera
    const response = await (handler as any)(req, ...args);
    console.log(`Auth Route - Odpowiedź wysłana: ${response.status}`);
    return response;
  } catch (error) {
    console.error("Auth Route - BŁĄD:", error);
    throw error;
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
