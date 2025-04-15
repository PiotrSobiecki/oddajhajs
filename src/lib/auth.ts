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

// Funkcja pomocnicza do oczyszczania zmiennych środowiskowych z cudzysłowów
function cleanEnv(value: string | undefined): string {
  if (!value) return "";

  // Usuń cudzysłowy z początku i końca
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
}

// Pobierz zmienne środowiskowe i oczyść je z cudzysłowów
const googleClientId = cleanEnv(process.env.GOOGLE_CLIENT_ID) || "";
const googleClientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET) || "";
const nextAuthSecret =
  cleanEnv(process.env.NEXTAUTH_SECRET) ||
  "fallback-secret-do-not-use-in-production";
const nextAuthUrl = cleanEnv(process.env.NEXTAUTH_URL);

// Wyświetl informacje o zmiennych po oczyszczeniu
console.log(`NEXTAUTH_URL po oczyszczeniu: ${nextAuthUrl}`);
console.log(
  `googleClientId po oczyszczeniu: ${
    googleClientId ? googleClientId.substring(0, 5) + "..." : "pusty"
  } (długość: ${googleClientId.length})`
);
console.log(
  `googleClientSecret po oczyszczeniu: ${
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

  // Wyświetl callback URL
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;
  console.log(`✅ Callback URL dla Google OAuth: ${callbackUrl}`);

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
        isNewUser: message.isNewUser,
        profile: message.profile ? "Dostępny" : "Brak",
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
    async createUser(message) {
      console.log("Sesja - Utworzono nowego użytkownika:", message.user.email);
    },
    async updateUser(message) {
      console.log("Sesja - Zaktualizowano użytkownika:", message.user.email);
    },
    async linkAccount(message) {
      console.log("Sesja - Połączono konto:", {
        provider: message.account.provider,
        user: message.user.email,
      });
    },
  },

  callbacks: {
    async jwt({ token, account, user }) {
      console.log("Sesja - Callback JWT:", {
        tokenExists: !!token,
        accountExists: !!account,
        userExists: !!user,
        tokenData: token ? { sub: token.sub, email: token.email } : null,
      });

      // JWT callback powinien zwracać token, nie session
      return token;
    },

    async session({ session, token }) {
      console.log("Sesja - Callback session:", {
        sessionExists: !!session,
        tokenExists: !!token,
        sessionUser: session?.user?.email,
        tokenSub: token?.sub,
      });

      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("Sesja - Callback redirect:", { url, baseUrl });
      console.log("Porównuję URL:", {
        url,
        baseUrl,
        startsWith1: url.startsWith(baseUrl),
        startsWith2: url.startsWith("/"),
      });

      // W przypadku błędu przekieruj na stronę logowania z informacją o błędzie
      if (url.includes("error=")) {
        console.log(`⚠️ Wykryto błąd w URL: ${url}`);
        return `${baseUrl}/login?${url.split("?")[1] || ""}`;
      }

      // Sprawdź czy URL jest bezwzględny (zawiera protokół)
      if (url.match(/^https?:\/\//)) {
        // Sprawdź domenę - jeśli jest taka sama jak baseUrl, pozwól na przekierowanie
        const urlDomain = new URL(url).hostname;
        const baseDomain = new URL(baseUrl).hostname;

        console.log(`Porównuję domeny: ${urlDomain} vs ${baseDomain}`);

        if (urlDomain === baseDomain) {
          console.log(`✅ Domeny zgodne, przekierowuję na ${url}`);
          return url;
        }

        console.log(
          `⚠️ Różne domeny, przekierowuję na bezpieczny URL: ${baseUrl}`
        );
        return baseUrl;
      }

      // Jeśli URL jest względny, pozwól na przekierowanie
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`;
        console.log(`✅ Przekierowuję na względny URL: ${fullUrl}`);
        return fullUrl;
      }

      // W każdym innym przypadku, użyj baseUrl
      console.log(`⚠️ Używam domyślnego baseUrl: ${baseUrl}`);
      return baseUrl;
    },

    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sesja - Callback signIn:", {
        user: user?.email,
        account: account?.provider,
        profile: profile ? "Dostępny" : "Brak",
        email: email ? "Dostępny" : "Brak",
        credentials: credentials ? "Dostępny" : "Brak",
      });

      // Dodajmy logowanie błędów na wypadek problemów
      try {
        // Sprawdźmy, czy wszystkie wymagane zmienne środowiskowe są dostępne
        if (!nextAuthUrl) {
          console.error("NEXTAUTH_URL nie jest dostępny!");
        }

        return true;
      } catch (error) {
        console.error("Błąd podczas logowania:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: nextAuthSecret,
};
