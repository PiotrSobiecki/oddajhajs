"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expense, Person, Payment } from "@/types";
import ExpenseForm from "@/components/ExpenseForm";
import Results from "@/components/Results";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    // Dodajemy klasę dark do elementu html
    document.documentElement.classList.add("dark");

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
  }, []);

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      // Pokazujemy Toast informujący o rozpoczęciu importu
      showToast("Importowanie pliku w toku...", "success");

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

            // Zwolnij pamięć po konwersji
            (workbook as any) = null;

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

      // Ograniczamy logowanie, aby nie obciążać konsoli i pamięci
      console.log("Rozpoczęto import pliku");

      // Dzielimy na linie i usuwamy puste
      const lines = cleanContent
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

      if (lines.length < 3) {
        showToast(
          "Nieprawidłowy format pliku. Plik powinien zawierać co najmniej 3 linie.",
          "error"
        );
        return;
      }

      // Zmienne do przechowywania danych
      const newPeople = new Set<string>();
      const importedExpenses: Expense[] = [];
      let currentSection = "";
      let foundExpenses = false;

      // Przetwarzamy linie - używamy setTimeout, aby zwolnić główny wątek i zapobiec zablokowaniu UI
      setTimeout(() => {
        processFileLines(lines, newPeople, importedExpenses);
      }, 0);
    } catch (error) {
      console.error("Błąd podczas przetwarzania pliku:", error);
      showToast(
        "Wystąpił błąd podczas przetwarzania pliku. Sprawdź format danych.",
        "error"
      );
    }
  };

  // Wydzielona funkcja przetwarzania linii, aby podzielić zadanie i nie blokować UI
  const processFileLines = (
    lines: string[],
    newPeople: Set<string>,
    importedExpenses: Expense[]
  ) => {
    let currentSection = "";
    let foundExpenses = false;

    // Funkcja pomocnicza do czyszczenia nazw osób
    const cleanPersonName = (name: string): string => {
      let cleanName = name.trim();
      // Usuwamy przecinek z początku nazwy jeśli istnieje
      while (cleanName.startsWith(",")) {
        cleanName = cleanName.substring(1).trim();
      }
      // Usuwamy przecinek z końca nazwy jeśli istnieje
      while (cleanName.endsWith(",")) {
        cleanName = cleanName.substring(0, cleanName.length - 1).trim();
      }
      return cleanName;
    };

    // Przetwarzamy linie
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Sprawdzamy nagłówki sekcji
      if (line.startsWith("Wydatki:") || line.includes("Wydatki:")) {
        currentSection = "expenses";
        foundExpenses = true;
        continue;
      }

      if (currentSection === "expenses" && i > 0) {
        // Pomijamy wiersz nagłówka
        if (line.includes("Opis;Kwota;") || line.includes("Opis,Kwota,")) {
          continue;
        }

        // Sprawdzamy czy linia ma separator CSV
        let parts: string[];
        const useSemicolon = line.includes(";");
        if (useSemicolon) {
          parts = line.split(";");
        } else if (line.includes(",")) {
          parts = line.split(",");
        } else {
          continue;
        }

        if (parts.length >= 4) {
          const [description, amountStr, paidByName, splitBetweenStr] = parts;

          // Próbujemy skonwertować kwotę na liczbę
          let amount: number;
          try {
            amount = parseFloat(amountStr.replace(",", ".").trim());
            if (isNaN(amount) || amount <= 0) {
              continue;
            }
          } catch (e) {
            continue;
          }

          const paidBy = cleanPersonName(paidByName);
          if (!paidBy) {
            continue;
          }

          // Sprawdzamy czy w paidBy jest format złożonej płatności (np. "kocu (50.00 zł), cybul (20.00 zł)")
          const paymentPattern = /([^(]+)\s*\(([0-9.,]+)\s*zł\)/g;
          let match;
          let isComplexPayment = false;
          const detectedPayments: { name: string; amount: number }[] = [];

          // Ponownie używamy oczyszczonego paidBy jako źródła do dopasowania
          const cleanedPaidBy = cleanPersonName(paidBy);
          const paymentText = cleanedPaidBy;

          while ((match = paymentPattern.exec(paymentText)) !== null) {
            const payerName = cleanPersonName(match[1]);
            const paymentAmount = parseFloat(match[2].replace(",", "."));

            if (!isNaN(paymentAmount) && paymentAmount > 0) {
              detectedPayments.push({
                name: payerName,
                amount: paymentAmount,
              });
              // Dodajemy osobę płacącą bez przecinka na początku
              newPeople.add(payerName);
              isComplexPayment = true;
            }
          }

          // Dla standardowej płatności dodaj osobę płacącą do kolekcji osób
          if (!isComplexPayment) {
            newPeople.add(paidBy);
          }

          // Przetwarzamy osoby, które składają się na wydatek
          let splitNames: string[] = [];

          // Najpierw sprawdź, czy mamy do czynienia z tekstem zawierającym nawiasy
          if (splitBetweenStr.includes("(") && splitBetweenStr.includes(")")) {
            // W przypadku tekstu z nawiasami, używamy bezpieczniejszej metody parsowania
            const matches = splitBetweenStr.match(/[^(),]+(?:\([^)]*\))?/g);
            if (matches) {
              splitNames = matches
                .map((name) => cleanPersonName(name))
                .filter((name) => name.length > 0);
            }
          } else {
            // Dla prostego tekstu bez nawiasów, rozdzielamy po przecinku lub pionowej kresce
            splitNames = splitBetweenStr
              .split(/,|\|/) // Rozdzielamy po przecinku lub znaku |
              .map((name) => cleanPersonName(name))
              .filter((name) => name.length > 0);
          }

          // Sprawdźmy, czy mamy brakujące osoby w splitNames
          if (splitNames.length === 0) {
            // Jeśli nie znaleziono osób dzielących wydatek, używamy wszystkich osób jako fallback
            // ale najpierw wypisujemy ostrzeżenie
            console.warn(
              `Dla wydatku "${description}" nie znaleziono osób dzielących koszt. Używamy wszystkich osób jako fallback.`
            );
            splitNames = Array.from(newPeople);
          }

          // Upewnij się, że wszystkie osoby w splitNames są dodane do listy osób
          splitNames.forEach((name) => {
            if (name && name.length > 0) {
              newPeople.add(name);
            }
          });

          // Tworzymy wydatek
          if (isComplexPayment && detectedPayments.length > 0) {
            // Tworzenie złożonego wydatku
            importedExpenses.push({
              id: uuidv4(),
              description: description.trim() || "Brak opisu",
              amount: amount,
              paidBy: "", // Dla złożonej płatności to pole jest puste
              splitBetween: [], // Tymczasowo puste, uzupełnimy po utworzeniu osób
              isComplexPayment: true,
              importedData: {
                paidByName: paidBy, // Zachowujemy oryginalny tekst dla parsowania późniejszego
                splitBetweenNames: splitNames,
              },
            });
          } else {
            // Tworzenie standardowego wydatku
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
          }
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

    // Tworzymy nowe osoby - używamy setTimeout, aby dać oddech wątkowi UI
    setTimeout(() => {
      finishProcessingImportedData(newPeople, importedExpenses);
    }, 0);
  };

  // Dokończenie przetwarzania danych importowanych z pliku
  const finishProcessingImportedData = (
    newPeople: Set<string>,
    importedExpenses: Expense[]
  ) => {
    // Funkcja do czyszczenia nazw - przycinamy białe znaki i usuwamy przecinki
    const cleanPersonName = (name: string): string => {
      let cleanName = name.trim();
      while (cleanName.startsWith(",")) {
        cleanName = cleanName.substring(1).trim();
      }
      while (cleanName.endsWith(",")) {
        cleanName = cleanName.substring(0, cleanName.length - 1).trim();
      }
      return cleanName;
    };

    // Przetwarzamy nazwy osób - przycinamy, usuwamy przecinki i deduplikujemy
    const cleanedPeople = new Set<string>();
    const nameVariants = new Map<string, string>(); // Mapa wariantów nazw do czystych nazw

    Array.from(newPeople).forEach((name) => {
      const cleanName = cleanPersonName(name);
      if (cleanName.length > 0) {
        cleanedPeople.add(cleanName);
        // Zapisujemy oryginalną nazwę jako wariant czystej nazwy
        nameVariants.set(name.toLowerCase(), cleanName);
      }
    });

    // Tworzymy obiekty osób
    const newPeopleArray: Person[] = Array.from(cleanedPeople).map((name) => ({
      id: uuidv4(),
      name: name,
    }));

    // Tworzymy mapę dla łatwego dostępu do ID osoby po jej nazwie
    const peopleMap = new Map<string, string>();
    newPeopleArray.forEach((person) => {
      peopleMap.set(person.name.toLowerCase(), person.id);
    });

    // Sprawdzamy istniejące osoby, aby uniknąć duplikatów
    const existingPeopleMap = new Map<string, string>();
    people.forEach((person) => {
      existingPeopleMap.set(person.name.toLowerCase(), person.id);
    });

    // Filtrujemy nowe osoby, aby uniknąć duplikatów
    const uniqueNewPeople = newPeopleArray.filter(
      (person) => !existingPeopleMap.has(person.name.toLowerCase())
    );

    // Aktualizujemy wydatki z właściwymi ID osób
    for (const expense of importedExpenses) {
      const importedData = expense.importedData;
      if (!importedData) continue;

      if (expense.isComplexPayment) {
        // Dla złożonych płatności, parsujemy dane aby wyciągnąć płatności
        const payments: Payment[] = [];
        const paymentPattern = /([^(]+)\s*\(([0-9.,]+)\s*zł\)/g;
        let match;
        const paymentText = cleanPersonName(importedData.paidByName);

        while ((match = paymentPattern.exec(paymentText)) !== null) {
          const payerName = cleanPersonName(match[1]);
          const paymentAmount = parseFloat(match[2].replace(",", "."));

          // Szukamy ID najpierw w nowych osobach, potem w istniejących
          let payerId = peopleMap.get(payerName.toLowerCase());
          if (!payerId) {
            payerId = existingPeopleMap.get(payerName.toLowerCase());
          }

          if (payerId && !isNaN(paymentAmount) && paymentAmount > 0) {
            payments.push({
              personId: payerId,
              amount: paymentAmount,
            });
          }
        }

        if (payments.length > 0) {
          expense.payments = payments;
        }
      } else {
        // Dla standardowych płatności
        const payerName = cleanPersonName(importedData.paidByName);

        // Szukamy ID najpierw w nowych osobach, potem w istniejących
        let payerId = peopleMap.get(payerName.toLowerCase());
        if (!payerId) {
          payerId = existingPeopleMap.get(payerName.toLowerCase());
        }

        if (payerId) {
          expense.paidBy = payerId;
        }
      }

      // Przetwarzamy listę osób pomiędzy którymi dzielony jest wydatek
      const splitBetweenIds: string[] = [];
      const processedNames = new Set<string>(); // Zbiór do śledzenia przetworzonych nazw

      if (importedData.splitBetweenNames) {
        for (const rawName of importedData.splitBetweenNames) {
          // Czyścimy nazwę - przycinamy białe znaki i usuwamy przecinki
          const cleanName = cleanPersonName(rawName);
          if (!cleanName) continue;

          const lowercaseName = cleanName.toLowerCase();

          // Sprawdzamy czy imię już zostało przetworzone
          if (processedNames.has(lowercaseName)) {
            continue;
          }

          // Szukamy ID najpierw w nowych osobach, potem w istniejących
          let personId = peopleMap.get(lowercaseName);
          if (!personId) {
            personId = existingPeopleMap.get(lowercaseName);
          }

          // Jeśli nie znaleziono, sprawdźmy czy to nie jest wariant nazwy
          if (!personId && nameVariants.has(rawName.toLowerCase())) {
            const cleanVariant = nameVariants.get(rawName.toLowerCase());
            if (cleanVariant) {
              personId = peopleMap.get(cleanVariant.toLowerCase());
              if (!personId) {
                personId = existingPeopleMap.get(cleanVariant.toLowerCase());
              }
            }
          }

          if (personId) {
            splitBetweenIds.push(personId);
            processedNames.add(lowercaseName);
          }
        }
      }

      if (splitBetweenIds.length > 0) {
        expense.splitBetween = splitBetweenIds;
      }

      // Usuwamy niepotrzebne już dane importowane
      delete expense.importedData;
    }

    // Usuwamy wydatki z pustymi listami splitBetween
    const validExpenses = importedExpenses.filter(
      (expense) => expense.splitBetween.length > 0
    );

    // Aktualizujemy stan aplikacji
    setExpenses([...expenses, ...validExpenses]);
    setPeople([...people, ...uniqueNewPeople]);

    // Obliczamy rozliczenia
    calculateSettlements([...expenses, ...validExpenses]);

    // Przechodzimy do wyniku
    setStep("results");

    showToast(
      `Zaimportowano ${validExpenses.length} wydatków i ${uniqueNewPeople.length} osób.`,
      "success"
    );
    setShowImportModal(false);
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
    } else {
      showToast("Ej no, wypełnij wszystkie pola! Nie bądź leń!", "error");
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

  const handleUpdateExpense = (updatedExpense: Expense) => {
    // Sprawdzenie, czy to złożona płatność i aktualizacja kwoty
    if (updatedExpense.isComplexPayment && updatedExpense.payments) {
      const totalAmount = updatedExpense.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      updatedExpense.amount = totalAmount;

      // Dla złożonej płatności czyścimy pole paidBy, które nie jest używane
      updatedExpense.paidBy = "";
    }

    const updatedExpenses = expenses.map((expense) =>
      expense.id === updatedExpense.id ? updatedExpense : expense
    );

    setExpenses(updatedExpenses);
    calculateSettlements(updatedExpenses);
    saveState(people, updatedExpenses);

    showToast("Wydatek został zaktualizowany", "success");
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

    console.log("Obliczanie rozliczeń dla wydatków:", currentExpenses);

    // Obliczenie salda na podstawie wydatków
    currentExpenses.forEach((expense) => {
      console.log("Przetwarzanie wydatku w rozliczeniach:", expense);

      // Obsługa złożonych płatności (gdzie płaci wiele osób)
      if (
        expense.isComplexPayment &&
        expense.payments &&
        expense.payments.length > 0
      ) {
        const splitBetween = expense.splitBetween;
        const amount = expense.amount;

        if (splitBetween.length === 0) {
          console.warn(
            "Nieprawidłowy wydatek złożony (brak osób dzielących):",
            expense
          );
          return; // Pomijamy ten wydatek
        }

        const splitAmount = amount / splitBetween.length;
        console.log(
          `Kwota na osobę: ${splitAmount} (${amount} / ${splitBetween.length})`
        );

        // Dodaj odpowiednią kwotę każdej osobie, która zapłaciła
        expense.payments.forEach((payment) => {
          if (payment.personId && payment.amount > 0) {
            balances[payment.personId] =
              (balances[payment.personId] || 0) + payment.amount;
            console.log(
              `Dodaję ${payment.amount} do salda osoby ${payment.personId} (${
                people.find((p) => p.id === payment.personId)?.name
              })`
            );
          }
        });

        // Odejmij odpowiednią część od każdej osoby, która korzysta z wydatku
        splitBetween.forEach((personId) => {
          balances[personId] = (balances[personId] || 0) - splitAmount;
          console.log(
            `Odejmuję ${splitAmount} od salda osoby ${personId} (${
              people.find((p) => p.id === personId)?.name
            })`
          );
        });
      }
      // Obsługa standardowych płatności (gdzie płaci jedna osoba)
      else {
        const paidBy = expense.paidBy;
        const splitBetween = expense.splitBetween;
        const amount = expense.amount;

        // Sprawdź czy dane wydatku są poprawne
        if (!paidBy || splitBetween.length === 0) {
          console.warn("Nieprawidłowy wydatek standardowy:", expense);
          return; // Pomijamy ten wydatek
        }

        const splitAmount = amount / splitBetween.length;
        console.log(
          `Kwota na osobę: ${splitAmount} (${amount} / ${splitBetween.length})`
        );

        // Dodaj pełną kwotę osobie, która zapłaciła
        balances[paidBy] = (balances[paidBy] || 0) + amount;
        console.log(
          `Dodaję ${amount} do salda osoby ${paidBy} (${
            people.find((p) => p.id === paidBy)?.name
          })`
        );

        // Odejmij odpowiednią część od każdej osoby, która korzysta z wydatku
        splitBetween.forEach((personId) => {
          balances[personId] = (balances[personId] || 0) - splitAmount;
          console.log(
            `Odejmuję ${splitAmount} od salda osoby ${personId} (${
              people.find((p) => p.id === personId)?.name
            })`
          );
        });
      }
    });

    console.log("Obliczone salda:", balances);
    console.log(
      "Lista osób:",
      people.map((p) => `${p.id}: ${p.name}`)
    );

    // Zaokrąglamy wartości do 2 miejsc po przecinku, aby uniknąć błędów zaokrąglenia
    Object.keys(balances).forEach((key) => {
      balances[key] = Math.round(balances[key] * 100) / 100;
    });

    console.log("Zaokrąglone salda:", balances);

    // Algorytm rozliczeń
    const newSettlements: any[] = [];
    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < -0.009) // Filtrujemy osoby z ujemnym saldem (dłużnicy)
      .sort(([, a], [, b]) => a - b); // Sortujemy od największego długu do najmniejszego

    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0.009) // Filtrujemy osoby z dodatnim saldem (wierzyciele)
      .sort(([, a], [, b]) => b - a); // Sortujemy od największej wpłaty do najmniejszej

    console.log("Dłużnicy:", debtors);
    console.log("Wierzyciele:", creditors);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const [debtorId, debtorBalance] = debtors[debtorIndex];
      const [creditorId, creditorBalance] = creditors[creditorIndex];

      // Sprawdzamy czy dłużnik i wierzyciel nie są tą samą osobą
      if (debtorId === creditorId) {
        // Jeśli są tą samą osobą, przechodzimy do następnego dłużnika
        debtorIndex++;
        continue;
      }

      // Obliczamy kwotę transferu (minimalna z długu i wierzytelności)
      const amount = Math.min(-debtorBalance, creditorBalance);

      if (amount > 0.009) {
        // Jeśli kwota jest znacząca (większa niż zaokrąglenie)
        // Dodajemy rozliczenie
        const settlement = {
          from: debtorId,
          to: creditorId,
          amount: Math.round(amount * 100) / 100, // Zaokrąglamy do 2 miejsc po przecinku
        };
        newSettlements.push(settlement);
        console.log(
          `Rozliczenie: ${people.find((p) => p.id === debtorId)?.name} → ${
            people.find((p) => p.id === creditorId)?.name
          }: ${settlement.amount} zł`
        );
      }

      // Aktualizujemy salda po tym transferze
      const newDebtorBalance = debtorBalance + amount;
      const newCreditorBalance = creditorBalance - amount;

      // Sprawdzamy czy dłużnik został rozliczony (jego saldo jest bliskie zeru)
      if (Math.abs(newDebtorBalance) < 0.009) {
        debtorIndex++; // Przechodzimy do następnego dłużnika
      } else {
        // Aktualizujemy saldo dłużnika
        debtors[debtorIndex] = [debtorId, newDebtorBalance];
      }

      // Sprawdzamy czy wierzyciel został rozliczony (jego saldo jest bliskie zeru)
      if (Math.abs(newCreditorBalance) < 0.009) {
        creditorIndex++; // Przechodzimy do następnego wierzyciela
      } else {
        // Aktualizujemy saldo wierzyciela
        creditors[creditorIndex] = [creditorId, newCreditorBalance];
      }
    }

    console.log("Obliczone rozliczenia:", newSettlements);
    setSettlements(newSettlements);
  };

  const exportToCSV = () => {
    try {
      // Przygotuj dane do eksportu z rozszerzeniem csv (lepiej obsługiwane niż xlsx)
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // Format YYYY-MM-DD
      const filename = `OddajHajs_rozliczenie_${dateStr}.csv`;

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
        // Obsługa złożonych płatności
        if (expense.isComplexPayment && expense.payments) {
          const payersList = expense.payments
            .map((payment) => {
              const name =
                people.find((p) => p.id === payment.personId)?.name ||
                payment.personId;
              return `${name} (${payment.amount.toFixed(2)} zł)`;
            })
            .join(", ");

          const splitBetweenNames = expense.splitBetween
            .map((id) => people.find((p) => p.id === id)?.name || id)
            .join(", ");

          csvContent += `${expense.description};${expense.amount.toFixed(
            2
          )};${payersList};${splitBetweenNames}\r\n`;
        }
        // Obsługa standardowych płatności
        else {
          const paidByName =
            people.find((p) => p.id === expense.paidBy)?.name || expense.paidBy;
          const splitBetweenNames = expense.splitBetween
            .map((id) => people.find((p) => p.id === id)?.name || id)
            .join(", ");
          csvContent += `${expense.description};${expense.amount.toFixed(
            2
          )};${paidByName};${splitBetweenNames}\r\n`;
        }
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

  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      message,
      visible: true,
      type,
    });

    // Automatycznie ukrywamy toast po 5 sekundach
    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 5000);
  };

  const handleCloseIntroPopup = () => {
    setShowIntroPopup(false);
    localStorage.setItem("oddajhajs_seen_intro", "true");
  };

  const saveState = (currentPeople: Person[], currentExpenses: Expense[]) => {
    try {
      localStorage.setItem("oddajhajs_people", JSON.stringify(currentPeople));
      localStorage.setItem(
        "oddajhajs_expenses",
        JSON.stringify(currentExpenses)
      );
    } catch (error) {
      console.error("Błąd podczas zapisywania stanu:", error);
    }
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
                    <span className="hidden sm:inline">Dodaj ziomka</span>
                    <FaPlus className="inline sm:hidden" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Wpisz imię i naciśnij Enter lub kliknij przycisk dodawania
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
                    <span>Importuj dane z pliku csv</span>
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
              <div className="flex flex-col mb-6">
                <h1 className="text-2xl font-bold mb-4">
                  Wydatki z wyjazdu/imprezy
                </h1>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                  <button
                    onClick={() => setStep("people")}
                    className="w-full sm:w-auto px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Wróć do listy osób
                  </button>
                  {expenses.length > 0 ? (
                    <button
                      onClick={() => {
                        calculateSettlements(expenses);
                        setStep("results");
                      }}
                      className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Pokaż rozliczenie →
                    </button>
                  ) : (
                    <button
                      onClick={importFromFile}
                      className="w-full sm:w-auto px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Importuj z Excela
                    </button>
                  )}
                </div>
              </div>

              <ExpenseForm
                people={people}
                onAddExpense={addExpense}
                showToast={showToast}
              />
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
                          {expense.isComplexPayment && expense.payments ? (
                            <>
                              <p>
                                {expense.amount.toFixed(2)} zł - zapłaciło kilka
                                osób:
                              </p>
                              <ul className="ml-4 text-sm">
                                {expense.payments.map((payment, idx) => (
                                  <li key={idx}>
                                    {
                                      people.find(
                                        (p) => p.id === payment.personId
                                      )?.name
                                    }
                                    : {payment.amount.toFixed(2)} zł
                                  </li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <p>
                              {expense.amount.toFixed(2)} zł - zapłacił(a){" "}
                              {
                                people.find((p) => p.id === expense.paidBy)
                                  ?.name
                              }
                            </p>
                          )}
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
            <div className="mb-4 sm:flex sm:justify-end">
              <button
                onClick={() => setStep("expenses")}
                className="w-full sm:w-auto px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Wróć do wydatków
              </button>
            </div>

            <Results
              people={people}
              expenses={expenses}
              settlements={settlements}
              onAddExpense={addExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={deleteExpense}
              onExport={exportToCSV}
              showToast={showToast}
            />
          </div>
        )}
      </main>

      <Footer />

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
    </div>
  );
}
