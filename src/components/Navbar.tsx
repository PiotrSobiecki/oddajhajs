"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NavbarProps } from "@/types";
import LoginButton from "./LoginButton";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function Navbar({
  currentStep,
  onReset,
  onShowInstructions,
  onShowCalculator,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, update } = useSession();

  // Dodaję efekt nasłuchujący zdarzenia session:update
  useEffect(() => {
    // Funkcja sprawdzająca aktualizację nazwy użytkownika
    const checkSessionUpdate = () => {
      const storedSessionData = localStorage.getItem("lastSessionUpdate");
      if (storedSessionData) {
        try {
          const { timestamp, userName } = JSON.parse(storedSessionData);
          // Sprawdzamy, czy nazwa użytkownika w sesji różni się od tej w localStorage
          if (session?.user?.name !== userName) {
            // Odświeżamy stronę, aby zaktualizować nazwę w navbarze
            window.location.reload();
          }
        } catch (e) {
          console.error("Błąd odczytu danych sesji:", e);
        }
      }
    };

    // Sprawdzamy przy montowaniu komponentu
    checkSessionUpdate();

    // Nasłuchujemy zdarzenia storage, które może być wywołane z innych kart
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "lastSessionUpdate") {
        checkSessionUpdate();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [session]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Obsługa wylogowania
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="relative">
        <div className="absolute inset-0 bg-gray-800/10 backdrop-blur-sm -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => onReset()}
                  className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors border-none bg-transparent cursor-pointer"
                >
                  OddajHajs.org
                </button>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => onReset()}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-100 hover:text-blue-400"
                >
                  Nowe rozliczenie
                </button>
                <button
                  onClick={() => onShowInstructions()}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-100 hover:text-blue-400"
                >
                  Instrukcja
                </button>
                {onShowCalculator && (
                  <button
                    onClick={() => onShowCalculator()}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-100 hover:text-blue-400"
                  >
                    Kalkulator
                  </button>
                )}
                {session && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-100 hover:text-blue-400"
                  >
                    Moje ekipy 🤝
                  </Link>
                )}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center">
                <span className="text-sm text-gray-400">
                  {currentStep === "people" && "Krok 1: Dodaj osoby"}
                  {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                  {currentStep === "results" && "Krok 3: Wyniki"}
                </span>
              </div>
            </div>

            {/* LoginButton na desktopie */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <LoginButton />
            </div>

            {/* Menu mobilne */}
            <div className="-mr-2 flex items-center sm:hidden">
              {!session ? (
                // Dla niezalogowanych - zwykły przycisk logowania
                <div className="mr-2">
                  <div className="flex items-center">
                    <LoginButton />
                  </div>
                </div>
              ) : (
                // Dla zalogowanych - avatar otwierający menu
                <button
                  onClick={toggleMobileMenu}
                  className="flex items-center mr-2 space-x-1"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={`Zdjęcie ${session.user.name}`}
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-blue-400">
                      {session.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </button>
              )}

              {/* Przycisk hamburgera (zawsze widoczny dla niezalogowanych, opcjonalnie dla zalogowanych) */}
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Otwórz menu</span>
                {isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
          <div className="sm:hidden backdrop-blur-sm bg-gray-800/95">
            {/* Profil użytkownika (jeśli zalogowany) */}
            {session && session.user && (
              <div className="pt-3 pb-2 px-4 border-b border-gray-700">
                <div className="flex items-center">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={`Zdjęcie ${session.user.name}`}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-blue-400">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {session.user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {session.user.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Menu nawigacyjne */}
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  onReset();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
              >
                Nowe rozliczenie
              </button>
              <button
                onClick={() => {
                  onShowInstructions();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
              >
                Instrukcja
              </button>
              {onShowCalculator && (
                <button
                  onClick={() => {
                    onShowCalculator();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                >
                  Kalkulator
                </button>
              )}
              {session && (
                <Link
                  href="/dashboard"
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Moje ekipy 🤝
                </Link>
              )}
            </div>

            {/* Informacja o kroku */}
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-4">
                <span className="text-sm text-gray-400">
                  {currentStep === "people" && "Krok 1: Dodaj osoby"}
                  {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                  {currentStep === "results" && "Krok 3: Wyniki"}
                </span>
              </div>

              {/* Przycisk wylogowania (tylko dla zalogowanych) */}
              {session && (
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-400 hover:bg-gray-700"
                  >
                    Wyloguj się
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
