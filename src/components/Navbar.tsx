"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NavbarProps } from "@/types";
import LoginButton from "./LoginButton";
import { useSession } from "next-auth/react";

export default function Navbar({
  currentStep,
  onReset,
  onShowInstructions,
  onShowCalculator,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <LoginButton />
            </div>

            <div className="-mr-2 flex items-center sm:hidden">
              <div className="mr-2">
                <div className="flex items-center">
                  <LoginButton />
                </div>
              </div>
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
          <div className="sm:hidden backdrop-blur-sm bg-gray-800/10">
            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  onReset();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
              >
                Nowe rozliczenie
              </button>
              <button
                onClick={() => {
                  onShowInstructions();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
              >
                Instrukcja
              </button>
              {onShowCalculator && (
                <button
                  onClick={() => {
                    onShowCalculator();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                >
                  Kalkulator
                </button>
              )}
              {session && (
                <Link
                  href="/dashboard"
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Moje ekipy 🤝
                </Link>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-3">
                <span className="text-sm text-gray-400">
                  {currentStep === "people" && "Krok 1: Dodaj osoby"}
                  {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                  {currentStep === "results" && "Krok 3: Wyniki"}
                </span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
