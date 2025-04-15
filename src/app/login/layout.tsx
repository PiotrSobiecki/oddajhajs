import AppLayout from "@/components/AppLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logowanie - OddajHajs.org",
  description:
    "Zaloguj się do aplikacji OddajHajs.org aby zarządzać grupami i rozliczeniami.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
