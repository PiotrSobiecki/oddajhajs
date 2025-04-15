import { NextResponse } from "next/server";

const HIDDEN_MARK = "********";

export async function GET() {
  // Sprawdzamy wszystkie zmienne środowiskowe Railway
  const railwayVars = Object.keys(process.env)
    .filter((key) => key.startsWith("RAILWAY_"))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {} as Record<string, string | undefined>);

  // Sprawdzamy zmienne związane z uwierzytelnianiem Google
  const googleVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? process.env.GOOGLE_CLIENT_ID.includes("dummy")
        ? "DUMMY_VALUE"
        : process.env.GOOGLE_CLIENT_ID.substring(0, 5) + HIDDEN_MARK
      : undefined,
    GOOGLE_CLIENT_ID_LENGTH: process.env.GOOGLE_CLIENT_ID?.length,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      ? process.env.GOOGLE_CLIENT_SECRET.includes("dummy")
        ? "DUMMY_VALUE"
        : HIDDEN_MARK
      : undefined,
    GOOGLE_CLIENT_SECRET_LENGTH: process.env.GOOGLE_CLIENT_SECRET?.length,
  };

  // Sprawdzamy zmienne związane z NextAuth
  const nextAuthVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
      ? process.env.NEXTAUTH_SECRET.includes("dummy")
        ? "DUMMY_VALUE"
        : HIDDEN_MARK
      : undefined,
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length,
  };

  // Sprawdzamy zmienne związane z bazą danych
  const dbVars = {
    DATABASE_URL: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.includes("dummy")
        ? "DUMMY_VALUE"
        : process.env.DATABASE_URL.substring(0, 10) + HIDDEN_MARK
      : undefined,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length,
  };

  // Sprawdzamy ogólne zmienne środowiskowe
  const generalVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    PORT: process.env.PORT,
  };

  return NextResponse.json({
    railway: railwayVars,
    google: googleVars,
    nextAuth: nextAuthVars,
    database: dbVars,
    general: generalVars,
    timestamp: new Date().toISOString(),
  });
}
