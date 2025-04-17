import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności - OddajHajs.org",
  description:
    "Zasady przetwarzania i ochrony danych osobowych użytkowników serwisu OddajHajs.org.",
};

export default function PolitykaPrywatnosciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
