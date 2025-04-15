import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { JWT } from "next-auth/jwt";

// Rozszerzamy typy NextAuth, aby obsługiwać dodatkowe pola w tokenie
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
  }
}

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
export function cleanEnv(value: string | undefined): string {
  if (!value) return "";

  // Usuń cudzysłowy z początku i końca
  let cleaned = value.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // Sprawdź, czy wartość to placeholder (używamy nowych placeholderów)
  const placeholders = [
    "placeholder_id_for_build_time",
    "placeholder_secret_for_build_time",
    "placeholder_db_url_for_build_time",
    "dummy_id_for_build_time",
    "dummy_secret_for_build_time",
    "dummy_db_url_for_build_time",
  ];

  if (placeholders.some((placeholder) => cleaned.includes(placeholder))) {
    console.error(
      `⚠️ UWAGA: Zmienna środowiskowa zawiera placeholder: ${cleaned.substring(
        0,
        10
      )}...`
    );
    console.error(
      `To oznacza, że zmienne z Railway nie są poprawnie przekazywane do aplikacji!`
    );
    return "";
  }

  return cleaned;
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

  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          redirect_uri: `${nextAuthUrl}/api/auth/callback/google`,
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid profile email",
        },
      },
      // Logujemy więcej informacji o procesie logowania
      async profile(profile, tokens) {
        console.log("Google profile callback:", {
          profileExists: !!profile,
          profileSub: profile.sub,
          profileEmail: profile.email,
          serverUrl: nextAuthUrl,
          tokensAvailable: !!tokens,
          tokensExpiry: tokens.expiry_date,
          tokenScope: tokens.scope,
        });

        return {
          id: profile.sub,
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.picture,
        };
      },
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

  // Callbacki
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("JWT callback:", {
        tokenExists: !!token,
        userExists: !!user,
        accountExists: !!account,
        tokenSub: token?.sub,
        userId: user?.id,
        accountId: account?.providerAccountId,
      });

      if (account && user) {
        // Log successful authentication
        console.log("Authentication successful:", {
          provider: account.provider,
          userEmail: user.email,
          userName: user.name,
        });

        // Zachowaj podstawowe informacje o użytkowniku
        token.userId = user.id;
        if (user.email) {
          token.email = user.email;
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log("Session callback:", {
        sessionExists: !!session,
        tokenExists: !!token,
        tokenUserId: token?.userId,
        tokenEmail: token?.email,
        tokenSub: token?.sub,
      });

      if (token && token.userId) {
        session.user.id = token.userId as string;
        console.log("Session updated with user id:", token.userId);
      }

      return session;
    },

    // Obsługa przekierowań - rozszerzona wersja do obsługi zagnieżdżonych URL
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl, nextAuthUrl });
      // Lepsza logika przekierowania
      if (url.startsWith(baseUrl)) {
        console.log("Przekierowanie do URL w bazowym URL:", url);
        return url;
      } else if (url.startsWith("/")) {
        console.log("Przekierowanie do względnego URL:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      console.log("Przekierowanie do domyślnego URL:", baseUrl);
      return baseUrl;
    },

    // Prosta walidacja logowania
    async signIn({ user, account, profile }) {
      console.log("signIn callback:", {
        userExists: !!user,
        accountExists: !!account,
        profileExists: !!profile,
        redirectUrl: nextAuthUrl,
      });
      return true;
    },
  },

  // Niestandardowe strony
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },

  // Sekret
  secret: nextAuthSecret,
};
