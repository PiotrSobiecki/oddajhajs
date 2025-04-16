"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default function LoginButton() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obsługa kliknięcia poza dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 md:origin-top-right md:right-0 origin-top-left left-0">
          {session.user?.name && (
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              <span className="block font-medium">{session.user.name}</span>
              <span className="block text-xs text-gray-400">
                {session.user.email}
              </span>
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
