import { NextResponse } from "next/server";

// Ta funkcja pomoże sprawdzić, czy przekierowania działają poprawnie
export async function GET(request: Request) {
  // Najpierw standardowa metoda (która może nie działać w Railway)
  const url = new URL(request.url);
  const standardBaseUrl = url.origin;

  // Metoda uwzględniająca proxy i nagłówki Railway
  let detectedBaseUrl = "";

  // Pobierz nagłówki X-Forwarded-* stosowane przez Railway
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    detectedBaseUrl = `${forwardedProto}://${forwardedHost}`;
  }

  // Preferuj NEXTAUTH_URL, jeśli jest dostępny
  const configuredBaseUrl = process.env.NEXTAUTH_URL || "";

  // Użyj najlepszego dostępnego baseUrl
  const baseUrl = configuredBaseUrl || detectedBaseUrl || standardBaseUrl;

  // Parametry z zapytania
  const params = Object.fromEntries(url.searchParams);

  // Adres callbacka, który musi działać w Google OAuth
  const callbackUrl = `${baseUrl}/api/auth/callback/google`;

  // Nagłówki zapytania
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json({
    test: "success",
    message: "Jeśli widzisz tę wiadomość, przekierowania działają poprawnie",
    baseUrlFromRequest: standardBaseUrl,
    baseUrlFromHeaders: detectedBaseUrl,
    baseUrlFromEnv: configuredBaseUrl,
    baseUrlUsed: baseUrl,
    callbackUrl: callbackUrl,
    verifyUrl: `${baseUrl}/api/auth/verify-redirect`,
    requestHeaders: headers,
    params: params,
    envInfo: {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      googleClientIdExists: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    },
  });
}
