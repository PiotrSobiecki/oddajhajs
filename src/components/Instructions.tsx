"use client";

import React, { useState } from "react";
import {
  FaTimes,
  FaMoneyBillWave,
  FaUserFriends,
  FaCalculator,
} from "react-icons/fa";

interface InstructionsProps {
  onClose: () => void;
}

export default function Instructions({ onClose }: InstructionsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-400">
              Jak wyciągnąć hajs od znajomych?
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6 text-gray-300">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaUserFriends className="text-blue-400 text-2xl" />
                  <h3 className="text-xl font-semibold">
                    Krok 1: Dodaj ziomków do spłaty
                  </h3>
                </div>
                <p>
                  Na początku musisz wrzucić na listę wszystkich, którzy razem z
                  Tobą płacili za imprezkę/wyjazd/kebaby.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Wpisz ksywkę/imię delikwenta</li>
                  <li>
                    Kliknij "Dodaj" (albo łupnij w Enter, jak Ci się nie chce
                    myszką klikać)
                  </li>
                  <li>Powtarzaj, aż dodasz całą ekipę, która ma się zrzucić</li>
                  <li>
                    Potrzebujesz minimum 2 osoby - trudno się rozliczać samemu
                    ze sobą, nie?
                  </li>
                  <li>
                    Możesz też od razu zaimportować wszystkie dane z Excela
                    klikając "Importuj dane z Excela" - przyspieszysz robotę!
                  </li>
                </ul>
                <div className="bg-gray-700 p-4 rounded-md border-l-4 border-blue-400">
                  <p className="text-blue-300">
                    <strong>Pro-tip:</strong> Możesz wpisać też swój pseudonim!
                    Chyba że lubisz być anonimowym sponsorem...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaMoneyBillWave className="text-blue-400 text-2xl" />
                  <h3 className="text-xl font-semibold">
                    Krok 2: Wpisz, na co kto walnął hajsem
                  </h3>
                </div>
                <p>
                  Teraz dodaj wszystkie wydatki, czyli gdzie kasa poszła i kto
                  ją wyciągnął z portfela.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Wpisz co to było (np. "Kebsy po melanżu", "Paliwo do
                    Krakowa", "Chlanie na plaży")
                  </li>
                  <li>
                    Walnij kwotę, ile to kosztowało (oczywiście w zł, nie w
                    kapslach od piwa)
                  </li>
                  <li>Zaznacz, kto wyciągnął kartę/gotówkę</li>
                  <li>
                    Wybierz, kto ma się na to złożyć (bo może ktoś nie jadł tych
                    kebsów?)
                  </li>
                  <li>Kliknij "Dodaj wydatek" i powtórz dla następnego</li>
                </ul>
                <div className="bg-gray-700 p-4 rounded-md border-l-4 border-blue-400">
                  <p className="text-blue-300">
                    <strong>Lifehack:</strong> Lepiej wpisuj wydatki
                    poprzedniego dnia, bo na kacu możesz nie pamiętać, kto
                    płacił za Jägery...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaCalculator className="text-blue-400 text-2xl" />
                  <h3 className="text-xl font-semibold">
                    Krok 3: Pora na ściąganie długów!
                  </h3>
                </div>
                <p>
                  Teraz nadchodzi najlepsza część - dowiesz się, kto ile ma Ci
                  oddać hajsu (albo komu Ty musisz oddać).
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Zobacz całą listę wydatków (jeśli masz blackout, to teraz
                    sobie przypomnisz)
                  </li>
                  <li>
                    Sprawdź, kto ma komu przelać hajs (i gdzie najlepiej wysłać
                    ponaglenia)
                  </li>
                  <li>
                    Możesz zmienić wydatki, jeśli ktoś nagle sobie przypomniał,
                    że "to on jednak płacił"
                  </li>
                  <li>
                    Dodaj nowe wydatki, jeśli ktoś właśnie sobie przypomniał o
                    taksówce
                  </li>
                  <li>
                    Wyeksportuj wyniki do Excela i wyślij marudom, którzy "nie
                    pamiętają, że mieli oddać"
                  </li>
                </ul>
                <div className="bg-gray-700 p-4 rounded-md border-l-4 border-blue-400">
                  <p className="text-blue-300">
                    <strong>Sekretna technika:</strong> Aplikacja sama ogarnia,
                    jak rozdzielić hajs, żeby było jak najmniej przelewów. Mniej
                    roboty dla wszystkich, więcej czasu na kolejne spotkania!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index + 1 === currentStep ? "bg-blue-400" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                >
                  Cofnij
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {currentStep === totalSteps ? "Zamknij" : "Dalej"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
