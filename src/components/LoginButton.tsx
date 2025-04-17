"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function LoginButton() {
  const { data: session, status, update } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  // Inicjalizacja displayName na podstawie session
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  // Dodajemy efekt do śledzenia szerokości ekranu
  useEffect(() => {
    // Ustaw szerokość przy montowaniu
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Obsługa kliknięcia poza dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (isEditingName) {
          setIsEditingName(false);
          setDisplayName(session?.user?.name || "");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingName, session?.user?.name]);

  // Automatyczne focus na input po przejściu do trybu edycji
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

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

      // Najpierw zapisujemy nową nazwę w zmiennej, aby uniknąć problemów z asynchronicznością
      const newName = displayName.trim();

      // Aktualizacja sesji po zmianie nazwy
      await update({
        ...session,
        user: {
          ...session?.user,
          name: newName,
        },
      });

      // Zapisujemy informację o aktualizacji nazwy w localStorage
      localStorage.setItem(
        "lastSessionUpdate",
        JSON.stringify({
          timestamp: new Date().getTime(),
          userName: newName,
        })
      );

      // Emitujemy zdarzenie niestandardowe, które powiadomi inne komponenty o aktualizacji sesji
      const updateEvent = new CustomEvent("session:update", {
        detail: {
          user: {
            ...session?.user,
            name: newName,
          },
        },
      });
      window.dispatchEvent(updateEvent);

      // Zamykamy formularz edycji
      setIsEditingName(false);

      // Całkowicie odświeżamy stronę, aby wymusić aktualizację wszystkich komponentów
      window.location.reload();
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

  // Funkcja do ustawienia pozycji dropdown
  const getDropdownStyle = () => {
    if (windowWidth < 640) {
      // Mobilna
      return { right: "10px", left: "auto", transform: "none" };
    } else if (windowWidth >= 640 && windowWidth < 1024) {
      // Dla mniejszych ekranów desktopowych - wyrównaj mocniej w lewo
      return {
        right: "auto",
        left: "-60px", // Przesunięcie całego menu w lewo
        transform: "none",
      };
    } else {
      // Większe ekrany - standardowe pozycjonowanie
      return { right: "0", left: "auto", transform: "none" };
    }
  };

  if (status === "loading") {
    return (
      <button
        className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-gray-700 rounded-lg cursor-not-allowed opacity-70"
        disabled
      >
        <span>Ładowanie...</span>
      </button>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors md:min-w-[160px]"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
        </svg>
        <span className="hidden md:inline">Zaloguj przez Google</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-center space-x-1 text-sm focus:outline-none"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
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
        <span className="hidden md:block text-white font-medium">
          {session.user?.name?.split(" ")[0] ||
            session.user?.email?.split("@")[0]}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-blue-400 hidden md:block" />
      </button>

      {isDropdownOpen && (
        <div
          className="absolute z-50 w-64 py-1 mt-2 text-sm bg-gray-800 rounded-md shadow-lg"
          style={{
            ...getDropdownStyle(),
            maxWidth: "calc(100vw - 20px)",
          }}
        >
          {session.user && (
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              {isEditingName ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block font-medium text-gray-400">
                      Edytuj nazwę:
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={saveDisplayName}
                        disabled={isUpdating}
                        className="p-1 text-green-500 hover:text-green-400 disabled:opacity-50"
                        title="Zapisz"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditName}
                        className="p-1 text-red-500 hover:text-red-400"
                        title="Anuluj"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    placeholder="Wprowadź nazwę..."
                    maxLength={30}
                  />

                  {errorMessage && (
                    <p className="text-xs text-red-400">{errorMessage}</p>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="block font-medium">
                      {session.user.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-blue-400 hover:text-blue-300"
                    title="Edytuj nazwę"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-blue-400"
            onClick={() => setIsDropdownOpen(false)}
          >
            Moje ekipy 🤝
          </Link>
          <div className="border-t border-gray-700 my-1"></div>
          <button
            onClick={() => {
              signOut({ callbackUrl: "/" });
              setIsDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-blue-400"
          >
            Wyloguj się
          </button>
        </div>
      )}
    </div>
  );
}
