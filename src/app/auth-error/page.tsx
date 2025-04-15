"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

// Komponent z danymi (używa useSearchParams)
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostic = async () => {
      try {
        const response = await fetch("/api/auth/test-google-config");
        const data = await response.json();
        setDiagnostic(data);
      } catch (error) {
        console.error(
          "Błąd podczas pobierania informacji diagnostycznych:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostic();
  }, []);

  const getErrorDescription = () => {
    if (error === "google") {
      return "Wystąpił błąd podczas autoryzacji w Google. Może to być spowodowane nieprawidłową konfiguracją OAuth, niepoprawnym ID klienta/sekretem, lub brakiem uprawnień.";
    }
    if (error === "Callback") {
      return "Wystąpił błąd podczas przetwarzania odpowiedzi z Google. Może to być spowodowane nieprawidłowym adresem przekierowania lub problemami z sesją.";
    }
    if (error === "AccessDenied") {
      return "Dostęp zabroniony. Możliwe, że nie masz uprawnień do korzystania z tej aplikacji OAuth.";
    }
    if (error === "Configuration") {
      return "Błąd konfiguracji. Sprawdź zmienne środowiskowe i ustawienia NextAuth.";
    }

    return `Wystąpił błąd autoryzacji: ${error}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">
          Problem z logowaniem
        </h1>

        <div className="bg-red-900/30 border border-red-500 rounded-md p-4 mb-6">
          <h2 className="text-xl font-medium text-white mb-2">
            Szczegóły błędu
          </h2>
          <p className="text-white">{getErrorDescription()}</p>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <p className="text-gray-400">
              Ładowanie informacji diagnostycznych...
            </p>
          </div>
        ) : diagnostic ? (
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-md p-4">
              <h3 className="text-lg font-medium text-white mb-2">
                Informacje o środowisku
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <strong>NEXTAUTH_URL:</strong>{" "}
                  {diagnostic.environment.nextAuthUrl.value}
                  {!diagnostic.environment.nextAuthUrl.valid && (
                    <span className="text-red-400 ml-2">(Nieprawidłowy)</span>
                  )}
                </li>
                <li>
                  <strong>Google Client ID:</strong>{" "}
                  {diagnostic.environment.googleClientId.preview}
                  {!diagnostic.environment.googleClientId.valid && (
                    <span className="text-red-400 ml-2">(Nieprawidłowy)</span>
                  )}
                </li>
                <li>
                  <strong>Callback URL:</strong> {diagnostic.callback.url}
                </li>
              </ul>
            </div>

            <div className="bg-blue-900/30 border border-blue-500 rounded-md p-4">
              <h3 className="text-lg font-medium text-white mb-4">
                Co zrobić?
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-300">
                <li>
                  Upewnij się, że w Google Cloud Console masz skonfigurowany{" "}
                  <strong>dokładnie</strong> ten adres przekierowania:{" "}
                  <code className="bg-gray-700 px-2 py-1 rounded">
                    {diagnostic.callback.url}
                  </code>
                </li>
                <li>Sprawdź, czy ID klienta i sekret są poprawne</li>
                <li>
                  Upewnij się, że Twój adres email jest na liście testowych
                  użytkowników (jeśli aplikacja jest w trybie testowym)
                </li>
                <li>
                  Sprawdź, czy aplikacja OAuth jest włączona w Google Cloud
                  Console
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Link
                href={diagnostic.authUrl || "#"}
                className={`text-center px-4 py-3 rounded-md ${
                  diagnostic.authUrl
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => !diagnostic.authUrl && e.preventDefault()}
              >
                Spróbuj zalogować się bezpośrednio przez Google
              </Link>

              <Link
                href="/api/auth/debug-reset"
                className="text-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
              >
                Zresetuj sesję i wyczyść cookies
              </Link>

              <Link
                href="/"
                className="text-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                Wróć do strony głównej
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-red-400">
              Nie udało się pobrać informacji diagnostycznych.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
              Wróć do strony głównej
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Komponent fallback dla Suspense
function AuthErrorFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">
          Problem z logowaniem
        </h1>
        <div className="text-center py-6">
          <p className="text-gray-400">Ładowanie informacji o błędzie...</p>
        </div>
      </div>
    </div>
  );
}

// Główny komponent strony owinięty w Suspense
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
