import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { JWT } from "next-auth/jwt";

// Rozszerzamy typy NextAuth, aby obsługiwać dodatkowe pola
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

// Funkcja pomocnicza do usuwania cudzysłowów z wartości
function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.replace(/^['"](.*)['"]$/, "$1");
}

// Pobierz zmienne środowiskowe i oczyść je z cudzysłowów
const googleClientId = cleanEnv(process.env.GOOGLE_CLIENT_ID) || "";
const googleClientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET) || "";
const nextAuthSecret =
  cleanEnv(process.env.NEXTAUTH_SECRET) ||
  "fallback-secret-do-not-use-in-production";
const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL) || "";

// Wyświetl szczegółowe informacje o zmiennych po oczyszczeniu
console.log("=== ZMIENNE ŚRODOWISKOWE NEXTAUTH (po oczyszczeniu) ===");
console.log(`NEXTAUTH_URL: ${nextAuthUrl}`);
console.log(
  `GOOGLE_CLIENT_ID: ${
    googleClientId
      ? `${googleClientId.substring(0, 10)}... (${
          googleClientId.length
        } znaków)`
      : "BRAK"
  }`
);
console.log(
  `GOOGLE_CLIENT_SECRET: ${
    googleClientSecret
      ? `${googleClientSecret.substring(0, 5)}... (${
          googleClientSecret.length
        } znaków)`
      : "BRAK"
  }`
);
console.log("======================================================");

// Sprawdź, czy mamy rzeczywiste wartości (nie domyślne z .env.production)
const isDummyId = googleClientId.includes("dummy_id_for_build_time");
const isDummySecret = googleClientSecret.includes(
  "dummy_secret_for_build_time"
);

// Sprawdzenie czy mamy poprawne dane Google OAuth
const googleCredentialsAvailable =
  !isDummyId &&
  !isDummySecret &&
  googleClientId.length > 0 &&
  googleClientSecret.length > 0;

// Przygotuj listę providers
const providers = [];

// Dodaj Google provider tylko jeśli zmienne środowiskowe są dostępne
if (googleCredentialsAvailable) {
  console.log("✅ Konfiguracja Google OAuth dostępna. Dodawanie providera.");
  console.log(
    `   ID: ${googleClientId.substring(
      0,
      5
    )}... Secret: ${googleClientSecret.substring(0, 3)}...`
  );

  // Wyświetl callback URL
  const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;
  console.log(`✅ Callback URL dla Google OAuth: ${callbackUrl}`);

  // Dodajmy Google provider
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.log(
    "❌ UWAGA: Brak konfiguracji Google OAuth. Logowanie przez Google będzie niedostępne."
  );
  console.log(
    `   GOOGLE_CLIENT_ID: ${
      isDummyId
        ? "Wartość domyślna (dummy)"
        : googleClientId
        ? "Ustawione"
        : "Brak"
    } (${googleClientId.length} znaków)`
  );
  console.log(
    `   GOOGLE_CLIENT_SECRET: ${
      isDummySecret
        ? "Wartość domyślna (dummy)"
        : googleClientSecret
        ? "Ustawione"
        : "Brak"
    } (${googleClientSecret.length} znaków)`
  );

  if (isDummyId)
    console.log(`   ID zawiera 'dummy_id_for_build_time': ${isDummyId}`);
  if (isDummySecret)
    console.log(
      `   Secret zawiera 'dummy_secret_for_build_time': ${isDummySecret}`
    );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,

  // Ustawienia sesji
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dni
  },

  // Ustawienia cookies
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // Używamy HTTPS
      },
    },
  },

  // Włącz tryb debug
  debug: true,

  // Callbacki
  callbacks: {
    jwt: async ({ token, user }) => {
      console.log("JWT Callback - token exists:", !!token);
      console.log("JWT Callback - user exists:", !!user);

      if (user) {
        console.log("JWT Callback - setting userId:", user.id);
        token.userId = user.id;
      }

      return token;
    },
    session: async ({ session, token }) => {
      console.log("Session Callback - session exists:", !!session);
      console.log("Session Callback - token exists:", !!token);
      console.log("Session Callback - token userId:", token.userId);
      console.log("Session Callback - token email:", token.email);
      console.log("Session Callback - token userId type:", typeof token.userId);
      console.log("Session Callback - session user before:", session.user);

      if (token && token.userId) {
        session.user.id = token.userId;
        console.log(
          "Session Callback - session user after update:",
          session.user
        );
      }

      return session;
    },
  },

  // Niestandardowe strony
  pages: {
    signIn: "/login",
    error: "/login", // Strona z błędami logowania
  },

  // Sekret
  secret: nextAuthSecret,
};
