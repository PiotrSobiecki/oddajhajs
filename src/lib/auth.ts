import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dni
    updateAge: 24 * 60 * 60, // 24 godziny
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // Gdy użytkownik się loguje, zapisujemy informacje w tokenie
      if (user) {
        token.sub = user.id;
      }

      // Zawsze pobieramy najnowsze dane użytkownika z bazy
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub! },
        select: { name: true, email: true, image: true },
      });

      if (dbUser) {
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.picture = dbUser.image;
      }

      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.sub!;
        // Aktualizujemy nazwę, email i obrazek na podstawie tokena, który zawiera najnowsze dane z bazy
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    signIn: async ({ user, account, profile }) => {
      return true;
    },
    redirect: ({ url, baseUrl }) => {
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      } else if (url.startsWith("http")) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
