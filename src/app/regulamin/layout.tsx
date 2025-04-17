import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin - OddajHajs.org",
  description: "Regulamin korzystania z serwisu OddajHajs.org.",
};

export default function RegulaminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
