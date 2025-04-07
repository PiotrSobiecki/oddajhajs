import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "OddajHajs.org - Koniec z problemami z kasą!",
  description:
    "Rozlicz wydatki z imprezy, wyjazdu czy zamówienia. Sprawdź kto komu ile hajsu ma oddać i odzyskaj swoje pieniądze albo dopłać do imprezy!",
  keywords:
    "rozliczenia grupowe, podział wydatków, oddaj hajs, podział kosztów, impreza, wyjazd, znajomi, pieniądze",
  authors: [{ name: "OddajHajs.org Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
