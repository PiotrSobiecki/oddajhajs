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

  const addPerson = () => {
    if (newPersonName.trim() === "") return;

    const newPerson: Person = {
      id: uuidv4(),
      name: newPersonName.trim(),
    };

    setPeople([...people, newPerson]);
    setNewPersonName("");
  };

  const importFromFile = () => {
    // Tworzymy ukryty input file
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          processFileContent(data);

          // Wyświetl toast o sukcesie
          setToast({
            message: "Dane zostały zaimportowane pomyślnie!",
            visible: true,
            type: "success",
          });

          // Ukryj toast po 5 sekundach
          setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
          }, 5000);
        } catch (error) {
          console.error("Błąd podczas przetwarzania pliku:", error);
          setToast({
            message:
              "Wystąpił błąd podczas importowania danych. Sprawdź format pliku.",
            visible: true,
            type: "error",
          });

          setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
          }, 5000);
        }
      };

      reader.readAsBinaryString(file);
    };

    input.click();
  };

  const processFileContent = (data: any) => {
    const wb = XLSX.read(data, { type: "binary" });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Tutaj dodaj logikę przetwarzania danych z pliku CSV/Excel
    // Na przykład, możesz zaimplementować dodawanie osób i wydatków z pliku

    // To jest przykładowa implementacja - dostosuj ją do swojego formatu danych
    if (jsonData && jsonData.length > 0) {
      // Tymczasowe tablice do przechowywania przetworzonych danych
      const newPeople: Person[] = [];
      const newExpenses: Expense[] = [];

      // Przetwarzanie danych - możesz dostosować tę logikę
      for (let i = 1; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        if (row && row.length > 0) {
          // Przykładowa logika - dostosuj do swojego formatu
          const personName = row[0];
          if (personName && !newPeople.some((p) => p.name === personName)) {
            newPeople.push({
              id: uuidv4(),
              name: personName,
            });
          }
        }
      }

      // Aktualizacja stanu
      setPeople((prevPeople) => {
        // Dodaj tylko osoby, których jeszcze nie ma
        const updatedPeople = [...prevPeople];
        for (const person of newPeople) {
          if (!updatedPeople.some((p) => p.name === person.name)) {
            updatedPeople.push(person);
          }
        }
        return updatedPeople;
      });
    }
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

  const handleCloseIntroPopup = () => {
    setShowIntroPopup(false);
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
