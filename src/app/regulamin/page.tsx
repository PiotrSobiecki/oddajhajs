"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function RegulaminPage() {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">
          Regulamin serwisu OddajHajs.org
        </h1>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §1. Postanowienia ogólne
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. Niniejszy regulamin określa zasady korzystania z serwisu
              internetowego OddajHajs.org, dostępnego pod adresem
              https://oddajhajs.org.
            </p>
            <p>
              2. Właścicielem i administratorem serwisu jest zespół
              OddajHajs.org.
            </p>
            <p>3. Korzystanie z serwisu jest dobrowolne i bezpłatne.</p>
            <p>
              4. Korzystanie z serwisu oznacza akceptację niniejszego regulaminu
              oraz{" "}
              <Link
                href="/polityka-prywatnosci"
                className="text-blue-400 hover:text-blue-300"
              >
                Polityki Prywatności
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §2. Definicje
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. <strong>Serwis</strong> - serwis internetowy OddajHajs.org,
              dostępny pod adresem https://oddajhajs.org.
            </p>
            <p>
              2. <strong>Użytkownik</strong> - osoba fizyczna korzystająca z
              serwisu.
            </p>
            <p>
              3. <strong>Konto</strong> - zbiór zasobów i uprawnień w ramach
              serwisu, przypisanych konkretnemu użytkownikowi.
            </p>
            <p>
              4. <strong>Grupa</strong> - utworzony przez użytkownika zbiór
              osób, między którymi rozliczane są wydatki.
            </p>
            <p>
              5. <strong>Wydatek</strong> - zarejestrowana w serwisie informacja
              o poniesionym koszcie przez jednego lub więcej użytkowników grupy.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §3. Zasady korzystania z serwisu
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. Serwis służy do rozliczania wspólnych wydatków w grupach
              znajomych, rodziny lub współpracowników.
            </p>
            <p>
              2. Korzystanie z podstawowych funkcji serwisu jest możliwe bez
              rejestracji konta.
            </p>
            <p>
              3. Utworzenie konta umożliwia korzystanie z dodatkowych funkcji,
              takich jak zapisywanie grup i dostęp do historii rozliczeń.
            </p>
            <p>
              4. Użytkownik zobowiązuje się do korzystania z serwisu zgodnie z
              obowiązującym prawem, dobrymi obyczajami oraz postanowieniami
              niniejszego regulaminu.
            </p>
            <p>
              5. Zabronione jest dostarczanie przez użytkownika treści o
              charakterze bezprawnym, obraźliwym lub naruszającym dobra osobiste
              osób trzecich.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §4. Rejestracja i konto użytkownika
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>1. Rejestracja w serwisie jest dobrowolna i bezpłatna.</p>
            <p>
              2. Rejestracja odbywa się poprzez uwierzytelnienie przy użyciu
              konta Google.
            </p>
            <p>
              3. Użytkownik jest zobowiązany do podania prawdziwych danych
              podczas rejestracji.
            </p>
            <p>
              4. Użytkownik może w każdej chwili usunąć swoje konto kontaktując
              się z administratorem serwisu.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §5. Przetwarzanie danych
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. Serwis gromadzi wyłącznie dane wprowadzone przez użytkowników w
              ramach korzystania z funkcji serwisu.
            </p>
            <p>
              2. Dane są przechowywane na serwerach z zachowaniem odpowiednich
              środków bezpieczeństwa.
            </p>
            <p>
              3. Szczegółowe informacje dotyczące przetwarzania danych osobowych
              znajdują się w{" "}
              <Link
                href="/polityka-prywatnosci"
                className="text-blue-400 hover:text-blue-300"
              >
                Polityce Prywatności
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §6. Odpowiedzialność
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. Administrator serwisu nie ponosi odpowiedzialności za przerwy w
              funkcjonowaniu serwisu wynikające z przyczyn technicznych.
            </p>
            <p>
              2. Administrator serwisu nie ponosi odpowiedzialności za treści
              wprowadzane przez użytkowników.
            </p>
            <p>
              3. Administrator serwisu nie ponosi odpowiedzialności za szkody
              poniesione przez użytkownika w wyniku korzystania z serwisu.
            </p>
            <p>
              4. Użytkownik korzysta z serwisu na własną odpowiedzialność i
              ryzyko.
            </p>
            <p>
              5. Administrator serwisu nie ponosi odpowiedzialności za
              poprawność rozliczeń dokonywanych przy pomocy serwisu. Obliczenia
              mają charakter informacyjny i to użytkownik odpowiada za
              weryfikację ich poprawności.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            §7. Postanowienia końcowe
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              1. Administrator serwisu zastrzega sobie prawo do zmiany
              niniejszego regulaminu w dowolnym czasie.
            </p>
            <p>
              2. O zmianach w regulaminie użytkownicy będą informowani poprzez
              zamieszczenie odpowiedniej informacji na stronie serwisu.
            </p>
            <p>
              3. Korzystanie z serwisu po wprowadzeniu zmian w regulaminie
              oznacza ich akceptację.
            </p>
            <p>
              4. W sprawach nieuregulowanych niniejszym regulaminem zastosowanie
              mają przepisy prawa polskiego.
            </p>
            <p>5. Regulamin wchodzi w życie z dniem 1 maja 2024 roku.</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Powrót do strony głównej
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
