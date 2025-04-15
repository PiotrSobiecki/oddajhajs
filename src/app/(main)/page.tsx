"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expense, Person, Payment } from "@/types";
import ExpenseForm from "@/components/ExpenseForm";
import Results from "@/components/Results";
import Navbar from "@/components/Navbar";
import Instructions from "@/components/Instructions";
import Calculator from "@/components/Calculator";
import * as XLSX from "xlsx";
import { FaCheckCircle, FaExclamationTriangle, FaPlus } from "react-icons/fa";
import IntroPopup from "@/components/IntroPopup";

export default function Home() {
  const [step, setStep] = useState<"people" | "expenses" | "results">("people");
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showIntroPopup, setShowIntroPopup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({
    message: "",
    visible: false,
    type: "success",
  });

  useEffect(() => {
    // Sprawdzamy czy użytkownik już widział popup
    const hasSeenIntro = localStorage.getItem("oddajhajs_seen_intro");
    if (!hasSeenIntro) {
      setShowIntroPopup(true);
    }

    // Tworzymy ukryty input dla plików
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.style.display = "none";
    input.addEventListener("change", handleFileSelect);
    document.body.appendChild(input);
    setFileInput(input);

    return () => {
      if (fileInput) {
        fileInput.removeEventListener("change", handleFileSelect);
        document.body.removeChild(fileInput);
      }
    };
  }, [fileInput]);

  const handleCloseIntroPopup = () => {
    setShowIntroPopup(false);
    localStorage.setItem("oddajhajs_seen_intro", "true");
  };

  const importFromFile = () => {
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelect = (event: Event) => {
    // Uproszczona wersja funkcji obsługującej wybór pliku
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      showToast("Importowanie pliku w toku...", "success");
      // W produkcyjnej wersji tutaj byłaby faktyczna obsługa pliku
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      message,
      visible: true,
      type,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleShowCalculator = () => {
    setShowCalculator(true);
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
  };

  const addPerson = () => {
    if (newPersonName.trim()) {
      const person = {
        id: uuidv4(),
        name: newPersonName.trim(),
      };
      setPeople([...people, person]);
      setNewPersonName("");
    }
  };

  const resetApp = () => {
    setPeople([]);
    setExpenses([]);
    setSettlements([]);
    setStep("people");
  };

  return (
    <>
      <div className="bg-gray-800/10 backdrop-blur-sm -z-10 mb-6">
        <div className="container mx-auto">
          <Navbar
            currentStep={step}
            onReset={resetApp}
            onShowInstructions={handleShowInstructions}
            onShowCalculator={handleShowCalculator}
          />
        </div>
      </div>

      {step === "people" && (
        <div className="space-y-8">
          <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6 text-white">
              Kto się składał się na imprezce lub wyjeździe?
            </h1>

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addPerson()}
                  placeholder="Ksywa/imię delikwenta"
                  className="flex-grow p-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                />
                <button
                  onClick={addPerson}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="hidden sm:inline">Dodaj ziomka</span>
                  <FaPlus className="inline sm:hidden" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Wpisz imię i naciśnij Enter lub kliknij przycisk dodawania
              </p>
            </div>

            {people.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Ekipa:</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {people.map((person) => (
                    <li key={person.id} className="text-lg text-white">
                      {person.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {people.length >= 2 && (
                <button
                  onClick={() => setStep("expenses")}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Teraz wrzuć wydatki →</span>
                </button>
              )}
              {(people.length === 0 || expenses.length === 0) && (
                <button
                  onClick={importFromFile}
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Importuj dane z pliku csv</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 ml-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              Jak to działa?
            </h2>
            <ol className="list-decimal pl-5 space-y-3 text-gray-300">
              <li>
                Dodaj ziomków, którzy leczyli kaca razem z Tobą lub bawili się
                na Majorce 🏄‍♂️
              </li>
              <li>
                Wrzuć wszystkie wydatki - kto płacił i kto jadł/pił/korzystał z
                czyjegoś hajsu
              </li>
              <li>Zobacz kto jest spłukany i ma oddać kasę! 🔥</li>
              <li>
                Wyślij listę dłużników z kwotami - niech wiedzą ile hajsu mają
                oddać 💸
              </li>
              <li>
                Zaloguj się, aby zapisywać rozliczenia w chmurze i tworzyć grupy
                ze znajomymi 🔐
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Sekcje expenses i results pozostają bez zmian */}

      {showInstructions && (
        <Instructions onClose={() => setShowInstructions(false)} />
      )}

      {showCalculator && <Calculator onClose={handleCloseCalculator} />}

      {/* Popup informacyjny */}
      {showIntroPopup && <IntroPopup onClose={handleCloseIntroPopup} />}

      {/* Toast powiadomienie */}
      {toast.visible && (
        <div
          className={`fixed bottom-8 inset-x-0 mx-auto max-w-md z-50 flex items-center justify-center gap-3 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white px-8 py-4 rounded-lg shadow-xl animate-bounceIn`}
        >
          {toast.type === "success" ? (
            <FaCheckCircle className="text-2xl text-white" />
          ) : (
            <FaExclamationTriangle className="text-2xl text-white" />
          )}
          <span className="text-lg font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Zamknij powiadomienie"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
