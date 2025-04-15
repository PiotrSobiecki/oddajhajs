import AppLayout from "@/components/AppLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grupy rozliczeniowe - OddajHajs.org",
  description:
    "Zarządzaj grupami rozliczeniowymi i śledź wydatki wśród znajomych.",
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
