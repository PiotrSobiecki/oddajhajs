import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headersList = headers();

  // Pobierz wszystkie parametry
  const params = Object.fromEntries(url.searchParams);

  // Pobierz wszystkie nagłówki
  const allHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  // Pobierz zmienne środowiskowe (tylko nazwy)
  const envVars = [
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "DATABASE_URL",
  ].map((name) => ({
    name,
    exists: !!process.env[name],
    value: name === "NEXTAUTH_URL" ? process.env[name] : undefined, // Tylko NEXTAUTH_URL pokazujemy pełną wartość
  }));

  // Sprawdź próbę przekierowania
  const redirectCheck = {
    baseUrl: process.env.NEXTAUTH_URL || "",
    expectedCallback: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    actualUrl: request.url,
    match: request.url.includes("/api/auth/callback/google"),
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    params,
    headers: allHeaders,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      envVars,
    },
    redirectCheck,
    info: "Ten endpoint służy do debugowania problemów z callbackiem OAuth. Jeśli widzisz tę wiadomość, oznacza to, że endpoint działa poprawnie.",
  });
}
