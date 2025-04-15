import { NextResponse } from "next/server";

export async function GET() {
  // Sprawdź, czy zmienne środowiskowe są ustawione
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Określ, czy Google OAuth jest dostępny
  const googleAvailable = !!(googleClientId && googleClientSecret);

  return NextResponse.json({
    googleAvailable,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}
