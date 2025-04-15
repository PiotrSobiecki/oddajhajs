import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

// Funkcja pomocnicza do debugowania zmiennych środowiskowych
export function logEnvVariables() {
  // Sprawdź i wyświetl informacje o zmiennych środowiskowych (tylko w konsoli)
  console.log("========== NEXTAUTH ZMIENNE ŚRODOWISKOWE ==========");
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(
    `GOOGLE_CLIENT_ID: ${
      process.env.GOOGLE_CLIENT_ID
        ? `Ustawione (długość: ${process.env.GOOGLE_CLIENT_ID.length})`
        : "Brak"
    }`
  );
  console.log(
    `GOOGLE_CLIENT_SECRET: ${
      process.env.GOOGLE_CLIENT_SECRET
        ? `Ustawione (długość: ${process.env.GOOGLE_CLIENT_SECRET.length})`
        : "Brak"
    }`
  );
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || "Brak"}`);
  console.log(
    `NEXTAUTH_SECRET: ${
      process.env.NEXTAUTH_SECRET
        ? `Ustawione (długość: ${process.env.NEXTAUTH_SECRET.length})`
        : "Brak"
    }`
  );
  console.log(
    `DATABASE_URL: ${
      process.env.DATABASE_URL
        ? `Ustawione (długość: ${process.env.DATABASE_URL.length})`
        : "Brak"
    }`
  );

  // Lista wszystkich dostępnych zmiennych środowiskowych
  console.log("Wszystkie zmienne środowiskowe RAILWAY_*:");
  Object.keys(process.env)
    .filter((key) => key.startsWith("RAILWAY_"))
    .forEach((key) => console.log(`- ${key}`));

  console.log("====================================================");

  // Dodajemy dodatkowe debugowanie
  console.log("Sesja - Zmienne środowiskowe:");
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- NEXTAUTH_URL dostępny: ${!!process.env.NEXTAUTH_URL}`);
  console.log(`- NEXTAUTH_SECRET dostępny: ${!!process.env.NEXTAUTH_SECRET}`);
  console.log(`- DATABASE_URL dostępny: ${!!process.env.DATABASE_URL}`);

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log(
    `- GOOGLE_CLIENT_ID dostępny: ${!!googleClientId}, długość: ${
      googleClientId?.length || 0
    }`
  );
  console.log(
    `- GOOGLE_CLIENT_SECRET dostępny: ${!!googleClientSecret}, długość: ${
      googleClientSecret?.length || 0
    }`
  );
}

// Wyświetl informacje o zmiennych środowiskowych przy uruchomieniu
logEnvVariables();

// Pobierz zmienne środowiskowe
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const nextAuthSecret =
  process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production";

console.log(
  `googleClientId: ${
    googleClientId ? googleClientId.substring(0, 5) + "..." : "pusty"
  } (długość: ${googleClientId.length})`
);
console.log(
  `googleClientSecret: ${
    googleClientSecret ? googleClientSecret.substring(0, 3) + "..." : "pusty"
  } (długość: ${googleClientSecret.length})`
);

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
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
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
  session: {
    strategy: "jwt",
  },
  debug: true, // Włączamy tryb debug dla lepszego logowania

  // Dodajmy funkcje wywoływane na różnych etapach autoryzacji
  events: {
    async signIn(message) {
      console.log("Sesja - Zdarzenie signIn:", {
        user: message.user.name || message.user.email,
        account: message.account?.provider,
      });
    },
    async signOut(message) {
      console.log("Sesja - Zdarzenie signOut:", {
        session: message.session?.user?.email,
      });
    },
    async session(message) {
      console.log("Sesja - Zdarzenie session (token refreshed)");
    },
  },

  callbacks: {
    async jwt({ token, account, user }) {
      console.log("Sesja - Callback JWT:", {
        tokenExists: !!token,
        accountExists: !!account,
        userExists: !!user,
      });

      // JWT callback powinien zwracać token, nie session
      return token;
    },

    async session({ session, token }) {
      console.log("Sesja - Callback session:", {
        sessionExists: !!session,
        tokenExists: !!token,
      });

      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: nextAuthSecret,
};
