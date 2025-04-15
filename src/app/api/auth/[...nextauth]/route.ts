import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("Auth Route - Inicjalizacja API Route NextAuth");

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
