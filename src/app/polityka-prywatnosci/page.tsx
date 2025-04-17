"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

export default function PolitykaPrywatnosciPage() {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">
          Polityka prywatności OddajHajs.org
        </h1>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            1. Informacje ogólne
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Niniejsza polityka prywatności określa zasady przetwarzania i
              ochrony danych osobowych użytkowników serwisu OddajHajs.org.
            </p>
            <p>
              Administratorem danych osobowych przetwarzanych w serwisie jest
              zespół OddajHajs.org.
            </p>
            <p>
              W sprawach związanych z ochroną danych osobowych można kontaktować
              się z nami pod adresem email: kontakt@oddajhajs.org.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            2. Jakie dane zbieramy
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              W zależności od sposobu korzystania z serwisu, możemy zbierać
              następujące dane:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Użytkownicy niezarejestrowani:</strong> Nie zbieramy
                żadnych danych osobowych od użytkowników, którzy korzystają z
                serwisu bez rejestracji. Mogą być zbierane jedynie anonimowe
                dane techniczne związane z funkcjonowaniem serwisu.
              </li>
              <li>
                <strong>Użytkownicy zarejestrowani:</strong> W przypadku
                rejestracji konta przez uwierzytelnienie Google, zbieramy
                podstawowe dane udostępniane przez Google, takie jak: imię i
                nazwisko, adres email oraz zdjęcie profilowe.
              </li>
              <li>
                <strong>Dane wprowadzone przez użytkownika:</strong> Wszelkie
                dane, które użytkownik wprowadza podczas korzystania z serwisu,
                takie jak nazwy grup, opisy wydatków czy kwoty.
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            3. Jak wykorzystujemy dane
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>Zbierane dane wykorzystujemy w następujących celach:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Świadczenie usług rozliczania wydatków grupowych i zarządzania
                grupami.
              </li>
              <li>Uwierzytelnianie użytkowników i zarządzanie ich kontami.</li>
              <li>
                Komunikacja z użytkownikami w sprawach związanych z działaniem
                serwisu.
              </li>
              <li>Poprawa jakości i funkcjonalności serwisu.</li>
              <li>Rozwiązywanie problemów technicznych.</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            4. Pliki cookies i technologie używane w przeglądarce
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Aplikacja OddajHajs.org może wykorzystywać standardowe mechanizmy
              pamięci przeglądarki, w tym:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Pliki cookies sesyjne:</strong> Tymczasowe pliki
                przechowywane w pamięci przeglądarki do momentu zakończenia
                sesji. Wykorzystywane są wyłącznie do obsługi logowania i
                utrzymania sesji użytkownika.
              </li>
              <li>
                <strong>Local Storage:</strong> Mechanizm przechowywania danych
                w przeglądarce, wykorzystywany do zapamiętywania ustawień
                interfejsu i preferencji użytkownika.
              </li>
            </ul>
            <p>
              Użytkownik może samodzielnie zarządzać ustawieniami przeglądarki,
              które kontrolują przechowywanie powyższych danych. Całkowite
              wyłączenie tych mechanizmów może spowodować nieprawidłowe
              działanie niektórych funkcji serwisu.
            </p>
            <p>
              Serwis OddajHajs.org nie wykorzystuje żadnych zewnętrznych
              narzędzi śledzących, systemów analitycznych ani mechanizmów
              profilujących użytkowników.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            5. Udostępnianie danych
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>Dane użytkowników mogą być udostępniane:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Podmiotom przetwarzającym dane na nasze zlecenie, uczestniczącym
                w wykonywaniu naszych czynności, np. dostawcom usług
                hostingowych, dostawcom usług IT.
              </li>
              <li>
                Innym użytkownikom serwisu w ramach grup rozliczeniowych
                utworzonych przez użytkownika lub do których został dodany.
              </li>
              <li>
                Organom państwowym lub innym podmiotom uprawnionym na podstawie
                przepisów prawa.
              </li>
            </ul>
            <p>
              Nie sprzedajemy ani nie wynajmujemy danych osobowych użytkowników
              podmiotom trzecim.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            6. Prawa użytkowników
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>Każdy użytkownik ma prawo do:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dostępu do swoich danych osobowych.</li>
              <li>Sprostowania (poprawiania) swoich danych.</li>
              <li>Usunięcia danych osobowych.</li>
              <li>Ograniczenia przetwarzania danych.</li>
              <li>Przenoszenia danych.</li>
              <li>Wniesienia sprzeciwu wobec przetwarzania danych.</li>
              <li>
                Wniesienia skargi do organu nadzorczego (Prezesa Urzędu Ochrony
                Danych Osobowych).
              </li>
            </ul>
            <p>
              Aby skorzystać z tych praw, należy skontaktować się z nami pod
              adresem: kontakt@oddajhajs.org.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            7. Bezpieczeństwo danych
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Dokładamy wszelkich starań, aby zapewnić bezpieczeństwo danych
              osobowych użytkowników. Stosujemy odpowiednie środki techniczne i
              organizacyjne, aby chronić dane przed nieuprawnionym dostępem,
              utratą lub zniszczeniem.
            </p>
            <p>
              Połączenie z serwisem jest zabezpieczone protokołem SSL, który
              szyfruje przesyłane dane.
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            8. Zmiany polityki prywatności
          </h2>
          <div className="text-gray-300 space-y-4">
            <p>
              Zastrzegamy sobie prawo do zmiany niniejszej polityki prywatności.
              O wszelkich zmianach będziemy informować użytkowników poprzez
              zamieszczenie odpowiedniej informacji na stronie serwisu.
            </p>
            <p>
              Aktualna wersja polityki prywatności obowiązuje od dnia 1 maja
              2024 roku.
            </p>
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
