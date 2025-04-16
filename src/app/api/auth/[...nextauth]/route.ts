import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic"; // Zmuszamy do trybu dynamicznego
export const runtime = "nodejs"; // Ustawiamy runtime na nodejs

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
