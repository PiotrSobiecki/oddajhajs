"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";

// Konfiguracja dynamicznego renderowania
export const dynamic = "force-dynamic";

// Komponent wewnętrzny, który używa useSearchParams
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  // Prostsza wersja handlera logowania
  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  // Pobieramy komunikat błędu
  const errorMessage =
    error === "OAuthAccountNotLinked"
      ? "To konto e-mail jest już połączone z innym kontem. Użyj tego samego dostawcy, którego użyłeś wcześniej."
      : error
      ? "Wystąpił błąd podczas logowania. Spróbuj ponownie."
      : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            Logowanie do OddajHajs.org
          </h1>
          <p className="mt-2 text-gray-400">
            Zaloguj się, aby zarządzać swoimi grupami rozliczeniowymi
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-white text-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle />
            <span>
              {isLoading ? "Logowanie..." : "Zaloguj się przez Google"}
            </span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-400 bg-gray-800">lub</span>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Kontynuuj bez logowania
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            Logowanie umożliwia tworzenie grup i zarządzanie rozliczeniami w
            gronie przyjaciół, ale możesz korzystać z OddajHajs.org również bez
            zakładania konta.
          </p>
        </div>
      </div>
    </div>
  );
}

// Komponent główny, który zawija LoginForm w Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="p-8 text-white">Ładowanie...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
