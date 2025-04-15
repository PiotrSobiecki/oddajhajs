import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "OddajHajs.org - Koniec z problemami z kasą!",
  description:
    "Rozlicz wydatki z imprezy, wyjazdu czy zamówienia. Sprawdź kto komu ile hajsu ma oddać i odzyskaj swoje pieniądze albo dopłać do imprezy!",
  keywords:
    "rozliczenia grupowe, podział wydatków, oddaj hajs, podział kosztów, impreza, wyjazd, znajomi, pieniądze",
  authors: [{ name: "OddajHajs.org Team" }],
  robots: "index, follow",
  metadataBase: new URL("https://oddajhajs.org"),
  openGraph: {
    type: "website",
    title: "OddajHajs.org - Odzyskaj swój hajs!",
    description:
      "Rozlicz melanż, wyjazd, zamówienie - kończymy z creative accounting!",
    siteName: "OddajHajs.org",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

// Wydzielono viewport zgodnie z zaleceniami Next.js
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
