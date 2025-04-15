"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const error = searchParams?.get("error");

  // Debugowanie parametrów URL
  useEffect(() => {
    console.log("Parametry URL podczas logowania:", {
      callbackUrl,
      error,
      details: searchParams?.get("details"),
      wszystkieParametry: Object.fromEntries(searchParams?.entries() || []),
    });
  }, [callbackUrl, error, searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    console.log("Rozpoczynam logowanie przez Google...");
    console.log("Aktualny URL:", window.location.href);

    // Pokaż szczegóły callbackUrl
    console.log("Parametry logowania:", {
      callbackFromUrl: callbackUrl,
      windowOrigin: window.location.origin,
      windowHref: window.location.href,
      defaultCallback: "/dashboard",
    });

    // Usuń wszystkie cookies związane z sesją
    try {
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.trim().split("=");
        if (name.includes("next-auth")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          console.log(`Usunięto cookie: ${name}`);
        }
      });
    } catch (e) {
      console.error("Błąd podczas usuwania cookies:", e);
    }

    try {
      // Wypróbuj alternatywną metodę przekierowania
      console.log("Alternatywne podejście do logowania przez Google");

      // Metoda 1: standardowe signIn z pełnym URL
      signIn("google", {
        callbackUrl: `${window.location.origin}/dashboard`,
        redirect: true,
      });

      /* // Metoda 2: bezpośrednie przekierowanie na endpoint logowania
      window.location.href = `${window.location.origin}/api/auth/signin/google?callbackUrl=${encodeURIComponent(
        `${window.location.origin}/dashboard`
      )}`; */

      // Ten kod nie zostanie wykonany, gdyż nastąpi przekierowanie przeglądarki
    } catch (error) {
      console.error("Nieoczekiwany błąd podczas logowania:", error);
      setIsLoading(false);
    }
  };

  const getErrorMessage = () => {
    console.log("Kod błędu:", error);
    const errorDetails = searchParams?.get("details");

    if (error === "OAuthAccountNotLinked") {
      return "To konto e-mail jest już połączone z innym kontem. Użyj tego samego dostawcy, którego użyłeś wcześniej.";
    }
    if (error === "OAuthSignin") {
      return "Błąd podczas inicjowania logowania OAuth. Sprawdź konfigurację.";
    }
    if (error === "OAuthCallback") {
      return "Błąd podczas odbierania danych z OAuth. Sprawdź zmienne środowiskowe i przekierowania.";
    }
    if (error === "OAuthCreateAccount") {
      return "Nie można utworzyć konta użytkownika. Możliwe, że konto już istnieje.";
    }
    if (error === "EmailCreateAccount") {
      return "Nie można utworzyć konta użytkownika. Możliwe, że konto już istnieje.";
    }
    if (error === "Callback") {
      let message =
        "Błąd podczas obsługi odpowiedzi z usługi uwierzytelniania. Sprawdź, czy callback URL w konsoli Google jest ustawiony dokładnie na https://oddajhajs.org/api/auth/callback/google i czy domena jest autoryzowana.";

      if (errorDetails) {
        message += `\n\nSzczegóły błędu: ${errorDetails}`;
      }

      return message;
    }
    if (error === "AccessDenied") {
      return "Dostęp zabroniony. Nie masz uprawnień do zalogowania się.";
    }
    if (error === "Configuration") {
      return "Błąd konfiguracji serwera. Skontaktuj się z administratorem.";
    }
    if (error === "google") {
      return "Błąd podczas uwierzytelniania przez Google. Możliwe przyczyny: nieprawidłowa konfiguracja API, problemy z przekierowaniem, brak dostępu do API Google, nieautoryzowana domena. Sprawdź konsolę przeglądarki i logi serwera.";
    }

    if (error) {
      let message = `Wystąpił błąd podczas logowania (${error}).`;
      if (errorDetails) {
        message += ` Szczegóły: ${errorDetails}`;
      }
      message += " Spróbuj ponownie lub skontaktuj się z administratorem.";
      return message;
    }

    return null;
  };

  const errorMessage = getErrorMessage();

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
          <div className="p-4 bg-red-900/50 border border-red-500 rounded-md text-white text-sm space-y-3">
            <p className="whitespace-pre-line">{errorMessage}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => (window.location.href = "/login")}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Odśwież stronę logowania
              </button>
              <button
                onClick={() => (window.location.href = "/api/auth/debug-reset")}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Zresetuj sesję i wyczyść cookies
              </button>
              <button
                onClick={() =>
                  (window.location.href = "/api/auth/verify-redirect")
                }
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Sprawdź konfigurację przekierowań
              </button>
            </div>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Ładowanie...</h1>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
