import AppLayout from "@/components/AppLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel użytkownika - OddajHajs.org",
  description: "Zarządzaj swoimi grupami rozliczeniowymi i wydatkami.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
