import { NextResponse } from "next/server";

export async function GET() {
  // Sprawdzenie zmiennych środowiskowych z dodatkowymi informacjami diagnostycznymi
  const envStatus = {
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      status: process.env.DATABASE_URL ? "Ustawione" : "Brak",
      prefix: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.substring(0, 10) + "..."
        : "",
    },
    NEXTAUTH_URL: {
      exists: !!process.env.NEXTAUTH_URL,
      status: process.env.NEXTAUTH_URL ? "Ustawione" : "Brak",
      value: process.env.NEXTAUTH_URL || "",
    },
    NEXTAUTH_SECRET: {
      exists: !!process.env.NEXTAUTH_SECRET,
      status: process.env.NEXTAUTH_SECRET ? "Ustawione" : "Brak",
      length: process.env.NEXTAUTH_SECRET
        ? process.env.NEXTAUTH_SECRET.length
        : 0,
    },
    GOOGLE_CLIENT_ID: {
      exists: !!process.env.GOOGLE_CLIENT_ID,
      status: process.env.GOOGLE_CLIENT_ID ? "Ustawione" : "Brak",
      length: process.env.GOOGLE_CLIENT_ID
        ? process.env.GOOGLE_CLIENT_ID.length
        : 0,
    },
    GOOGLE_CLIENT_SECRET: {
      exists: !!process.env.GOOGLE_CLIENT_SECRET,
      status: process.env.GOOGLE_CLIENT_SECRET ? "Ustawione" : "Brak",
      length: process.env.GOOGLE_CLIENT_SECRET
        ? process.env.GOOGLE_CLIENT_SECRET.length
        : 0,
    },
  };

  // Sprawdź wszystkie zmienne środowiskowe (nazwy)
  const allEnvs = Object.keys(process.env).filter(
    (key) =>
      key.includes("GOOGLE_") ||
      key.includes("NEXTAUTH_") ||
      key.includes("DATABASE_")
  );

  return NextResponse.json({
    ...envStatus,
    allRelevantEnvs: allEnvs,
  });
}
