"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LoginButton from "./LoginButton";
import { useSession, signOut } from "next-auth/react";

export default function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Dodajemy funkcję określającą aktualny krok na podstawie pathname
  const getCurrentStep = () => {
    if (pathname === "/") {
      // Najpierw sprawdzamy fragment URL (hash)
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash === "#results") return "results";
        if (hash === "#expenses") return "expenses";
        if (!hash || hash === "#" || hash === "#people") return "people";
      }

      // Jeśli nie ma hash, zakładamy, że jesteśmy na pierwszym kroku
      return "people";
    }
    // Obsługa kroków dla stron związanych z ekipami
    else if (pathname === "/dashboard") {
      // Na dashboardzie pokazujemy krok tworzenia ekipy
      return "create_team";
    } else if (pathname.startsWith("/groups/")) {
      // Sprawdzamy, czy jesteśmy na stronie z wydatkami
      if (pathname.includes("/expenses")) {
        return "manage_expenses";
      }
      // Na głównej stronie grupy pokazujemy krok zarządzania członkami
      return "add_members";
    }
    // Nie pokazujemy kroków na innych stronach
    return null;
  };

  const currentStep = getCurrentStep();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { label: "Nowe rozliczenie", href: "/" },
    { label: "Instrukcja", href: "/#instructions" },
    { label: "Kalkulator", href: "/#calculator" },
    { label: "Moje ekipy 🤝", href: "/dashboard" },
  ];

  // Warunkowo dodaj link do grup tylko dla zalogowanych użytkowników
  const filteredLinks = session
    ? navLinks
    : navLinks.filter((link) => link.href !== "/dashboard");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
                OddajHajs.org
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === link.href ||
                    (link.href === "/dashboard" &&
                      pathname.startsWith("/groups"))
                      ? "text-blue-400"
                      : "text-gray-100 hover:text-blue-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {currentStep && (
            <div className="hidden md:flex md:items-center">
              <span className="text-sm text-gray-400">
                {/* Kroki dla standardowego przepływu */}
                {currentStep === "people" && "Krok 1: Dodaj osoby"}
                {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                {currentStep === "results" && "Krok 3: Wyniki"}

                {/* Kroki dla przepływu z ekipami */}
                {currentStep === "create_team" && "Krok 1: Tworzenie ekipy"}
                {currentStep === "add_members" && "Krok 2: Dodawanie członków"}
                {currentStep === "manage_expenses" &&
                  "Krok 3: Zarządzanie wydatkami"}
              </span>
            </div>
          )}

          <div className="hidden md:flex md:items-center">
            <LoginButton />
          </div>

          <div className="flex items-center md:hidden">
            <div className="mr-2">
              <div className="flex items-center">
                <LoginButton />
              </div>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Otwórz menu główne</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="pt-2 pb-3 space-y-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 text-base font-medium ${
                  pathname === link.href ||
                  (link.href === "/dashboard" && pathname.startsWith("/groups"))
                    ? "text-blue-400 bg-gray-800"
                    : "text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            {currentStep && (
              <div className="flex items-center px-5 pt-2 pb-2">
                <span className="text-sm text-gray-400">
                  {/* Kroki dla standardowego przepływu */}
                  {currentStep === "people" && "Krok 1: Dodaj osoby"}
                  {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                  {currentStep === "results" && "Krok 3: Wyniki"}

                  {/* Kroki dla przepływu z ekipami */}
                  {currentStep === "create_team" && "Krok 1: Tworzenie ekipy"}
                  {currentStep === "add_members" &&
                    "Krok 2: Dodawanie członków"}
                  {currentStep === "manage_expenses" &&
                    "Krok 3: Zarządzanie wydatkami"}
                </span>
              </div>
            )}

            {session && (
              <div className="mt-3 space-y-1 border-t border-gray-700 pt-3">
                {session.user?.name && (
                  <div className="px-5 pb-2 text-sm font-medium text-white">
                    Zalogowany jako: {session.user.name}
                  </div>
                )}
                <Link
                  href="/dashboard"
                  className="block w-full text-left px-5 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Moje ekipy
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-5 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                >
                  Wyloguj się
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
