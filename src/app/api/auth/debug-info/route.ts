import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Zmienne środowiskowe (bezpiecznie)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || "nie ustawione",
    NEXTAUTH_URL_SET: process.env.NEXTAUTH_URL ? "✓" : "✗",
    NEXTAUTH_SECRET_SET: process.env.NEXTAUTH_SECRET ? "✓" : "✗",
    GOOGLE_CLIENT_ID_SET: process.env.GOOGLE_CLIENT_ID ? "✓" : "✗",
    GOOGLE_CLIENT_SECRET_SET: process.env.GOOGLE_CLIENT_SECRET ? "✓" : "✗",
  };

  // 2. Informacje o żądaniu
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.startsWith("x-") || key === "host" || key === "referer") {
      headers[key] = value;
    }
  });

  // 3. Wartości które są potrzebne dla OAuth
  const baseUrl = process.env.NEXTAUTH_URL || url.origin;
  const authCallbackUrl = `${baseUrl}/api/auth/callback/google`;
  const signInUrl = `${baseUrl}/api/auth/signin/google`;

  // 4. Wygeneruj ważne URL do testowania
  const testUrls = {
    callbackUrl: authCallbackUrl,
    signInUrl: signInUrl,
    testSignInWithRedirect: `${signInUrl}?callbackUrl=${encodeURIComponent(
      "/dashboard"
    )}`,
    testVerifyRedirect: `${baseUrl}/api/auth/verify-redirect`,
  };

  return NextResponse.json({
    status: "success",
    message: "Informacje diagnostyczne",
    environment: envInfo,
    requestInfo: {
      method: request.method,
      url: request.url,
      headers: headers,
      baseUrl: url.origin,
      pathname: url.pathname,
    },
    oauthConfig: {
      detectedBaseUrl: baseUrl,
      authCallbackUrl: authCallbackUrl,
      signInUrl: signInUrl,
    },
    testUrls: testUrls,
    serverDate: new Date().toISOString(),
  });
}
