"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import LoginButton from "./LoginButton";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Calculator from "./Calculator";
import Instructions from "./Instructions";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

// Interfejs dla linków nawigacji
interface NavLink {
  label: string;
  href: string;
  action?: () => void;
}

export default function AppNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicjalizacja displayName na podstawie sesji
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  // Automatyczne focus na input po przejściu do trybu edycji
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

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
    // Zresetuj tryb edycji przy zamykaniu menu
    if (!isMobileMenuOpen === false) {
      cancelEditName();
    }
  };

  // Obsługa zapisywania nowej nazwy użytkownika
  const saveDisplayName = async () => {
    if (!displayName.trim()) {
      setErrorMessage("Nazwa nie może być pusta");
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Błąd aktualizacji nazwy");
      }

      // Aktualizacja sesji po zmianie nazwy
      await update({
        ...session,
        user: {
          ...session?.user,
          name: displayName.trim(),
        },
      });

      setIsEditingName(false);
    } catch (error) {
      console.error("Błąd podczas aktualizacji nazwy:", error);
      setErrorMessage(error instanceof Error ? error.message : "Wystąpił błąd");
    } finally {
      setIsUpdating(false);
    }
  };

  // Anulowanie edycji nazwy
  const cancelEditName = () => {
    setIsEditingName(false);
    setDisplayName(session?.user?.name || "");
    setErrorMessage("");
  };

  // Obsługa kalkulatora
  const handleShowCalculator = () => {
    setShowCalculator(true);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
  };

  // Obsługa instrukcji
  const handleShowInstructions = () => {
    setShowInstructions(true);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  // Podstawowe linki, zawsze dostępne
  const navLinks: NavLink[] = [
    { label: "Nowe rozliczenie", href: "/" },
    { label: "Instrukcja", href: "#", action: handleShowInstructions },
    { label: "Kalkulator", href: "#", action: handleShowCalculator },
  ];

  // Link do ekip tylko dla zalogowanych
  const groupsLink: NavLink = { label: "Moje ekipy 🤝", href: "/dashboard" };

  // Jeśli użytkownik jest zalogowany, dodaj link do ekip
  const displayLinks = session ? [...navLinks, groupsLink] : navLinks;

  // Obsługa kliknięcia przycisku wylogowania
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    setIsMobileMenuOpen(false);
  };

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
                OddajHajs.org
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {displayLinks.map((link, index) =>
                link.action ? (
                  <button
                    key={index}
                    onClick={link.action}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-100 hover:text-blue-400 hover:border-b-2 hover:border-blue-400`}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      pathname === link.href ||
                      (link.href === "/dashboard" &&
                        pathname.startsWith("/groups"))
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-gray-100 hover:text-blue-400 hover:border-b-2 hover:border-blue-400"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
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

          {/* Wyświetlanie LoginButton tylko na desktopie */}
          <div className="hidden md:flex md:items-center">
            <LoginButton />
          </div>

          {/* Przyciski mobilne */}
          <div className="flex items-center md:hidden">
            {!session ? (
              // Jeśli użytkownik nie jest zalogowany, pokazujemy przycisk logowania
              <LoginButton />
            ) : (
              // Jeśli użytkownik jest zalogowany, pokazujemy tylko jego avatar/inicjały
              <button
                onClick={toggleMobileMenu}
                className="flex items-center space-x-1"
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

            {/* Przycisk hamburger menu tylko jeśli nie jest zalogowany */}
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 ml-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
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
        <div className="md:hidden bg-gray-800 shadow-lg">
          {/* Informacje o użytkowniku (tylko jeśli zalogowany) */}
          {session && session.user && (
            <div className="pt-3 pb-2 px-4 border-b border-gray-700">
              {isEditingName ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-400">
                      Edytuj nazwę:
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={saveDisplayName}
                        disabled={isUpdating}
                        className="p-1 text-green-500 hover:text-green-400 disabled:opacity-50"
                        title="Zapisz"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={cancelEditName}
                        className="p-1 text-red-500 hover:text-red-400"
                        title="Anuluj"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="Wprowadź swoją nazwę..."
                    maxLength={30}
                  />

                  {errorMessage && (
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  )}
                </div>
              ) : (
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
                  <div className="ml-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-medium text-white">
                        {session.user.name}
                      </div>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="Edytuj nazwę"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {session.user.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linki nawigacyjne */}
          <div className="pt-2 pb-3 space-y-1">
            {displayLinks.map((link, index) =>
              link.action ? (
                <button
                  key={index}
                  onClick={() => {
                    if (link.action) link.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 text-base font-medium ${
                    pathname === link.href ||
                    (link.href === "/dashboard" &&
                      pathname.startsWith("/groups"))
                      ? "text-blue-400 bg-gray-700"
                      : "text-gray-100 hover:text-blue-400 hover:bg-gray-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Informacja o kroku */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-4">
              <span className="text-sm text-gray-400">
                {currentStep === "people" && "Krok 1: Dodaj osoby"}
                {currentStep === "expenses" && "Krok 2: Dodaj wydatki"}
                {currentStep === "results" && "Krok 3: Wyniki"}
                {currentStep === "create_team" && "Krok 1: Tworzenie ekipy"}
                {currentStep === "add_members" && "Krok 2: Dodawanie członków"}
                {currentStep === "manage_expenses" &&
                  "Krok 3: Zarządzanie wydatkami"}
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

      {/* Kalkulator bez przycisku 'Zastosuj' */}
      {showCalculator && <Calculator onClose={handleCloseCalculator} />}
      {showInstructions && <Instructions onClose={handleCloseInstructions} />}
    </nav>
  );
}
