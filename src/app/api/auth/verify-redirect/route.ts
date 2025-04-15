import { NextResponse } from "next/server";

// Ta funkcja pomoże sprawdzić, czy przekierowania działają poprawnie
export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const url = new URL(request.url);

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
    baseUrl,
    verifyUrl: `${baseUrl}/api/auth/verify-redirect`,
    callbackUrl: callbackUrl,
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
