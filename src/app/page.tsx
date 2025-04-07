"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expense, Person } from "@/types";
import ExpenseForm from "@/components/ExpenseForm";
import Results from "@/components/Results";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Instructions from "@/components/Instructions";
import Calculator from "@/components/Calculator";
import * as XLSX from "xlsx";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function Home() {
  const [step, setStep] = useState<"people" | "expenses" | "results">("people");
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
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
    // Dodajemy klasę dark do elementu html
    document.documentElement.classList.add("dark");

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

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      if (file.name.endsWith(".csv")) {
        // Obsługa plików CSV
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            parseCSVData(content);
          } catch (error) {
            showToast(
              "Błąd odczytu pliku CSV. Upewnij się, że to prawidłowy plik.",
              "error"
            );
            console.error("Błąd parsowania pliku CSV:", error);
          }
        };
        reader.readAsText(file, "UTF-8");
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Obsługa plików Excel
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });

            // Zakładamy, że dane są w pierwszym arkuszu
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Konwertujemy do CSV
            const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });
            parseCSVData(csv);
          } catch (error) {
            showToast(
              "Błąd odczytu pliku Excel. Upewnij się, że to prawidłowy plik.",
              "error"
            );
            console.error("Błąd parsowania pliku Excel:", error);
          }
        };
        reader.readAsBinaryString(file);
      } else {
        showToast(
          "Nieobsługiwany format pliku. Proszę wybrać plik CSV lub Excel (.xlsx, .xls).",
          "error"
        );
      }
    }
  };

  const parseCSVData = (content: string) => {
    try {
      // Usuwamy BOM jeśli istnieje
      const cleanContent = content.replace(/^\uFEFF/, "");
      console.log(
        "Zawartość pliku CSV:",
        cleanContent.substring(0, 200) + "..."
      ); // Pokazujemy początek pliku

      // Dzielimy na linie i usuwamy puste
      const lines = cleanContent
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);
      console.log(`Znaleziono ${lines.length} niepustych linii`);

      if (lines.length < 3) {
        showToast(
          "Nieprawidłowy format pliku. Plik powinien zawierać co najmniej 3 linie.",
          "error"
        );
        return;
      }

      // Zmienne do przechowywania danych
      const newPeople: Set<string> = new Set();
      const importedExpenses: Expense[] = [];
      let currentSection = "";
      let foundExpenses = false;

      // Przetwarzamy linie
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Linia ${i}: ${line}`);

        // Sprawdzamy nagłówki sekcji
        if (line.startsWith("Wydatki:") || line.includes("Wydatki:")) {
          currentSection = "expenses";
          foundExpenses = true;
          console.log("Znaleziono sekcję wydatków");
          continue;
        }

        if (currentSection === "expenses" && i > 0) {
          // Pomijamy wiersz nagłówka
          if (line.includes("Opis;Kwota;") || line.includes("Opis,Kwota,")) {
            console.log("Pomijam wiersz nagłówka");
            continue;
          }

          // Sprawdzamy czy linia ma separator CSV
          let parts: string[];
          if (line.includes(";")) {
            parts = line.split(";");
          } else if (line.includes(",")) {
            parts = line.split(",");
          } else {
            console.warn("Nieprawidłowy format linii (brak separatora):", line);
            continue;
          }

          console.log(`Podzielono linię na ${parts.length} części:`, parts);

          if (parts.length >= 4) {
            const [description, amountStr, paidByName, splitBetweenStr] = parts;

            // Próbujemy skonwertować kwotę na liczbę
            let amount: number;
            try {
              amount = parseFloat(amountStr.replace(",", ".").trim());
              if (isNaN(amount) || amount <= 0) {
                console.warn("Nieprawidłowa kwota:", amountStr);
                continue;
              }
            } catch (e) {
              console.warn("Błąd konwersji kwoty:", amountStr, e);
              continue;
            }

            const paidBy = paidByName.trim();
            if (!paidBy) {
              console.warn("Brak osoby płacącej");
              continue;
            }
            newPeople.add(paidBy);

            // Przetwarzamy osoby, które składają się na wydatek
            const splitNames = splitBetweenStr
              .split(/,|\|/) // Rozdzielamy po przecinku lub znaku |
              .map((name) => name.trim())
              .filter((name) => name.length > 0);

            if (splitNames.length === 0) {
              console.warn("Brak osób składających się na wydatek");
              continue;
            }

            splitNames.forEach((name) => newPeople.add(name));

            console.log(
              `Dodano wydatek: ${description.trim()}, ${amount} zł, zapłacił: ${paidBy}, dzielone między: ${splitNames.join(
                ", "
              )}`
            );

            // Tworzymy wydatek
            importedExpenses.push({
              id: uuidv4(),
              description: description.trim() || "Brak opisu",
              amount: amount,
              paidBy: "", // Tymczasowo puste, uzupełnimy po utworzeniu osób
              splitBetween: [], // Tymczasowo puste, uzupełnimy po utworzeniu osób
              importedData: {
                paidByName: paidBy,
                splitBetweenNames: splitNames,
              },
            });
          } else {
            console.warn("Za mało danych w linii:", line);
          }
        }
      }

      if (!foundExpenses) {
        showToast(
          "Nie znaleziono sekcji wydatków w pliku. Plik powinien zawierać nagłówek 'Wydatki:'.",
          "error"
        );
        return;
      }

      console.log(
        `Znaleziono ${newPeople.size} unikalnych osób i ${importedExpenses.length} wydatków`
      );

      // Tworzymy nowe osoby
      const newPeopleArray: Person[] = Array.from(newPeople).map((name) => ({
        id: uuidv4(),
        name,
      }));
      console.log("Utworzone osoby:", newPeopleArray);

      // Aktualizujemy wydatki z ID osób
      const processedExpenses = importedExpenses
        .map((expense) => {
          const paidByPerson = newPeopleArray.find(
            (p) => p.name === expense.importedData?.paidByName
          );

          if (!paidByPerson) {
            console.warn(
              `Nie znaleziono osoby płacącej: ${expense.importedData?.paidByName}`
            );
            return null;
          }

          const splitBetweenIds =
            expense.importedData?.splitBetweenNames
              .map((name) => {
                const person = newPeopleArray.find(
                  (p) => p.name === (name as string)
                );
                if (!person) {
                  console.warn(`Nie znaleziono osoby dla podziału: ${name}`);
                }
                return person ? person.id : "";
              })
              .filter((id: string) => id !== "") || [];

          if (splitBetweenIds.length === 0) {
            console.warn("Brak osób dla podziału wydatku:", expense);
            return null;
          }

          // Usuwamy tymczasowe dane
          const { importedData, ...expenseData } = expense as any;

          return {
            ...expenseData,
            paidBy: paidByPerson.id,
            splitBetween: splitBetweenIds,
          };
        })
        .filter(
          (expense): expense is Expense =>
            expense !== null &&
            Boolean(expense.paidBy) &&
            expense.splitBetween.length > 0
        );

      console.log(
        `Po przetworzeniu zostało ${processedExpenses.length} poprawnych wydatków`
      );

      if (processedExpenses.length === 0) {
        showToast(
          "Nie znaleziono prawidłowych danych wydatków w pliku.",
          "error"
        );
        return;
      }

      // Aktualizujemy stan aplikacji
      setPeople(newPeopleArray);
      setExpenses(processedExpenses);

      // Obliczamy rozliczenia
      calculateSettlements(processedExpenses);

      // Przechodzimy do wyniku
      setStep("results");

      // Pokazujemy ładny toast
      showToast(
        `Zaimportowano ${processedExpenses.length} wydatków i ${newPeopleArray.length} osób!`,
        "success"
      );
    } catch (error) {
      console.error("Błąd podczas przetwarzania pliku:", error);
      showToast(
        "Wystąpił błąd podczas przetwarzania pliku. Sprawdź format danych.",
        "error"
      );
    }
  };

  const importFromFile = () => {
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
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

  const addPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: uuidv4(),
        name: newPersonName.trim(),
      };
      setPeople([...people, newPerson]);
      setNewPersonName("");
    }
  };

  const addExpense = (expense: Expense) => {
    const newExpense = {
      ...expense,
      id: uuidv4(),
    };
    setExpenses([...expenses, newExpense]);
    calculateSettlements([...expenses, newExpense]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    const updatedExpenses = expenses.map((expense) =>
      expense.id === updatedExpense.id ? updatedExpense : expense
    );
    setExpenses(updatedExpenses);
    calculateSettlements(updatedExpenses);
  };

  const deleteExpense = (expenseId: string) => {
    const filteredExpenses = expenses.filter(
      (expense) => expense.id !== expenseId
    );
    setExpenses(filteredExpenses);
    calculateSettlements(filteredExpenses);
  };

  const calculateSettlements = (currentExpenses: Expense[]) => {
    // Inicjalizacja salda dla każdej osoby
    const balances: { [key: string]: number } = {};
    people.forEach((person) => {
      balances[person.id] = 0;
    });

    // Sprawdź czy są jakieś wydatki
    if (currentExpenses.length === 0) {
      setSettlements([]);
      return;
    }

    // Logowanie dla celów debugowania
    console.log("Obliczanie rozliczeń dla wydatków:", currentExpenses);
    console.log("Osoby:", people);

    // Obliczenie salda na podstawie wydatków
    currentExpenses.forEach((expense) => {
      const paidBy = expense.paidBy;
      const splitBetween = expense.splitBetween;
      const amount = expense.amount;

      // Sprawdź czy dane wydatku są poprawne
      if (!paidBy || splitBetween.length === 0) {
        console.warn("Nieprawidłowy wydatek:", expense);
        return; // Pomijamy ten wydatek
      }

      const splitAmount = amount / splitBetween.length;

      // Dodaj pełną kwotę osobie, która zapłaciła
      balances[paidBy] = (balances[paidBy] || 0) + amount;

      // Odejmij odpowiednią część od każdej osoby, która korzysta z wydatku
      splitBetween.forEach((personId) => {
        balances[personId] = (balances[personId] || 0) - splitAmount;
      });
    });

    console.log("Obliczone salda:", balances);

    // Zaokrąglamy wartości do 2 miejsc po przecinku, aby uniknąć błędów zaokrąglenia
    Object.keys(balances).forEach((key) => {
      balances[key] = Math.round(balances[key] * 100) / 100;
    });

    console.log("Zaokrąglone salda:", balances);

    // Algorytm rozliczeń
    const newSettlements: any[] = [];
    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < -0.009) // Używamy trochę mniejszej wartości dla lepszej precyzji
      .sort(([, a], [, b]) => a - b);

    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0.009) // Używamy trochę mniejszej wartości dla lepszej precyzji
      .sort(([, a], [, b]) => b - a);

    console.log("Dłużnicy:", debtors);
    console.log("Wierzyciele:", creditors);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const [debtorId, debtorBalance] = debtors[debtorIndex];
      const [creditorId, creditorBalance] = creditors[creditorIndex];

      const amount = Math.min(-debtorBalance, creditorBalance);

      if (amount > 0.009) {
        // Używamy trochę mniejszej wartości dla lepszej precyzji
        // Dodaj tylko jeśli kwota jest znacząca
        newSettlements.push({
          from: debtorId,
          to: creditorId,
          amount: Math.round(amount * 100) / 100, // Zaokrąglamy do 2 miejsc po przecinku
        });
      }

      const newDebtorBalance = debtorBalance + amount;
      const newCreditorBalance = creditorBalance - amount;

      if (Math.abs(newDebtorBalance) < 0.009) {
        debtorIndex++;
      } else {
        debtors[debtorIndex] = [debtorId, newDebtorBalance];
      }

      if (Math.abs(newCreditorBalance) < 0.009) {
        creditorIndex++;
      } else {
        creditors[creditorIndex] = [creditorId, newCreditorBalance];
      }
    }

    console.log("Obliczone rozliczenia:", newSettlements);
    setSettlements(newSettlements);
  };

  const exportToCSV = () => {
    try {
      // Przygotuj dane do eksportu z rozszerzeniem csv (lepiej obsługiwane niż xlsx)
      const filename = "OddajHajs_rozliczenie.csv";

      // Utwórz zawartość pliku CSV z separatorem średnika dla Excel
      let csvContent = "";

      // Nagłówki
      csvContent += "Rozliczenia: Płacący;Odbiorca;Kwota\r\n";

      // Dane rozliczeń
      settlements.forEach((settlement) => {
        const fromName =
          people.find((p) => p.id === settlement.from)?.name || settlement.from;
        const toName =
          people.find((p) => p.id === settlement.to)?.name || settlement.to;
        csvContent += `${fromName};${toName};${settlement.amount.toFixed(
          2
        )}\r\n`;
      });

      // Dodaj pustą linię separującą
      csvContent += "\r\n";

      // Nagłówki wydatków
      csvContent += "Wydatki: Opis;Kwota;Zapłacone przez;Dzielone między\r\n";

      // Dane wydatków
      expenses.forEach((expense) => {
        const paidByName =
          people.find((p) => p.id === expense.paidBy)?.name || expense.paidBy;
        const splitBetweenNames = expense.splitBetween
          .map((id) => people.find((p) => p.id === id)?.name || id)
          .join(", ");
        csvContent += `${expense.description};${expense.amount.toFixed(
          2
        )};${paidByName};${splitBetweenNames}\r\n`;
      });

      // Kodowanie znaków i przygotowanie pliku
      // Dodajemy BOM dla poprawnej obsługi polskich znaków w Excel
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8",
      });

      // Utwórz link do pobrania
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);

      // Pobierz plik
      link.click();

      // Usuń element i zwolnij URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Pokaż powiadomienie o sukcesie
      showToast("Plik został pomyślnie wyeksportowany!", "success");
    } catch (error) {
      console.error("Błąd podczas eksportu danych:", error);
      showToast(
        "Wystąpił błąd podczas eksportu danych. Spróbuj ponownie.",
        "error"
      );
    }
  };

  const resetApp = () => {
    setPeople([]);
    setExpenses([]);
    setSettlements([]);
    setStep("people");
  };

  // Funkcja do pokazywania komunikatu toast
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, visible: true, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 7000); // Toast zniknie po 7 sekundach
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <Navbar
        currentStep={step}
        onReset={() => {
          setStep("people");
          setPeople([]);
          setExpenses([]);
          setSettlements([]);
        }}
        onShowInstructions={handleShowInstructions}
        onShowCalculator={handleShowCalculator}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        {step === "people" && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold mb-6">
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
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={addPerson}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Dodaj ziomka
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Wpisz imię i naciśnij Enter lub kliknij "Dodaj ziomka"
                </p>
              </div>

              {people.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Ekipa:</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    {people.map((person) => (
                      <li key={person.id} className="text-lg">
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
                    <span>Importuj dane z Excela</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Jak to działa?</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Dodaj ziomków, którzy leczyli kaca razem z Tobą lub bawili się
                  na Majorce 🏄‍♂️
                </li>
                <li>
                  Wrzuć wszystkie wydatki - kto płacił i kto jadł/pił/korzystał
                  z czyjegoś hajsu
                </li>
                <li>Zobacz kto jest spłukany i ma oddać kasę! 🔥</li>
                <li>
                  Wyślij listę dłużników z kwotami - niech wiedzą ile hajsu mają
                  oddać 💸
                </li>
              </ol>
            </div>
          </div>
        )}

        {step === "expenses" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                  Wydatki z wyjazdu/imprezy
                </h1>
                <div className="space-x-2">
                  <button
                    onClick={() => setStep("people")}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Wróć do listy osób
                  </button>
                  {expenses.length > 0 ? (
                    <button
                      onClick={() => {
                        calculateSettlements(expenses);
                        setStep("results");
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Pokaż rozliczenie →
                    </button>
                  ) : (
                    <button
                      onClick={importFromFile}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Importuj z Excela
                    </button>
                  )}
                </div>
              </div>

              <ExpenseForm people={people} onAddExpense={addExpense} />
            </div>

            {expenses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Dodane wydatki:</h2>
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {expense.description}
                          </h3>
                          <p>
                            {expense.amount.toFixed(2)} zł - zapłacił(a){" "}
                            {people.find((p) => p.id === expense.paidBy)?.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Dzielone między:{" "}
                            {expense.splitBetween
                              .map(
                                (id) => people.find((p) => p.id === id)?.name
                              )
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "results" && (
          <div>
            <div className="mb-4 flex justify-end space-x-2">
              <button
                onClick={() => setStep("expenses")}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Wróć do wydatków
              </button>
            </div>

            <Results
              people={people}
              expenses={expenses}
              settlements={settlements}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onExport={exportToCSV}
            />
          </div>
        )}
      </main>

      <Footer />

      {showInstructions && (
        <Instructions onClose={() => setShowInstructions(false)} />
      )}

      {showCalculator && <Calculator onClose={handleCloseCalculator} />}

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
    </div>
  );
}
