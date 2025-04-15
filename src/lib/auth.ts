import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

// Pobierz zmienne środowiskowe bezpośrednio
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const nextAuthSecret = process.env.NEXTAUTH_SECRET || "";

// Sprawdzenie czy mamy poprawne dane Google OAuth
const googleCredentialsAvailable =
  googleClientId.length > 0 && googleClientSecret.length > 0;

// Przygotuj listę providers
const providers = [];

// Dodaj Google provider tylko jeśli zmienne środowiskowe są dostępne
if (googleCredentialsAvailable) {
  console.log("Konfiguracja Google OAuth dostępna. Dodawanie providera.");
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.log(
    "UWAGA: Brak konfiguracji Google OAuth. Logowanie przez Google będzie niedostępne."
  );
  console.log(`GOOGLE_CLIENT_ID: ${googleClientId ? "Ustawione" : "Brak"}`);
  console.log(
    `GOOGLE_CLIENT_SECRET: ${googleClientSecret ? "Ustawione" : "Brak"}`
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    signIn: async ({ user, account, profile }) => {
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: nextAuthSecret.length > 0 ? nextAuthSecret : undefined,
  debug: process.env.NODE_ENV === "development",
};
