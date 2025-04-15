"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaPlus,
  FaFileExport,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import ExpenseForm from "@/components/ExpenseForm";
import Results from "@/components/Results";
import Calculator from "@/components/Calculator";
import { Expense, Person, Payment } from "@/types";
import { v4 as uuidv4 } from "uuid";

type GroupExpense = Expense & {
  createdBy?: string;
};

type GroupMember = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export default function GroupExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
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
    if (status === "authenticated" && params.id) {
      fetchGroupDetails();
    }
  }, [status, params.id]);

  const fetchGroupDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pobierz szczegóły grupy
      const response = await fetch(`/api/groups/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd pobierania danych grupy");
      }
      const groupData = await response.json();
      setGroupName(groupData.name);

      // Pobierz członków grupy
      const membersResponse = await fetch(`/api/groups/${params.id}/members`);
      if (!membersResponse.ok) {
        const errorData = await membersResponse.json();
        throw new Error(errorData.error || "Błąd pobierania członków grupy");
      }
      const membersData = await membersResponse.json();

      // Tworzymy mapę member.id -> user.id dla łatwego dostępu
      const memberIdToUserId = new Map();
      const userIdToMemberId = new Map();

      // Przekształć członków grupy na format Person
      const peopleData: Person[] = membersData.map((member: GroupMember) => {
        memberIdToUserId.set(member.id, member.user.id);
        userIdToMemberId.set(member.user.id, member.id);

        return {
          id: member.user.id, // Używamy user.id jako identyfikatora osoby
          name: member.user.name || "Użytkownik",
        };
      });

      setPeople(peopleData);

      // Pobierz wydatki grupy (zakładamy, że istnieje endpoint /api/groups/[id]/expenses)
      // Ten endpoint musiałby zostać zaimplementowany
      const expensesResponse = await fetch(`/api/groups/${params.id}/expenses`);
      if (expensesResponse.ok) {
        let expensesData = await expensesResponse.json();

        // Przekształć identyfikatory członków na identyfikatory użytkowników, jeśli jest taka potrzeba
        expensesData = expensesData.map((expense: any) => {
          // Dla złożonych płatności
          if (expense.isComplexPayment && expense.payments) {
            return {
              ...expense,
              payments: expense.payments.map((payment: any) => ({
                ...payment,
                personId:
                  memberIdToUserId.get(payment.personId) || payment.personId,
              })),
            };
          }
          return expense;
        });

        setExpenses(expensesData);
        calculateSettlements(expensesData);
      }
    } catch (err: any) {
      console.error("Błąd podczas pobierania danych:", err);
      setError(err.message || "Wystąpił nieznany błąd");
    } finally {
      setIsLoading(false);
    }
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

  const addExpense = async (expense: Expense) => {
    if (!session?.user?.id) {
      showToast("Musisz być zalogowany, aby dodawać wydatki", "error");
      return;
    }

    const newExpense: GroupExpense = {
      ...expense,
      id: uuidv4(),
      createdBy: session.user.id,
    };

    try {
      // Wysyłamy wydatek do API
      const response = await fetch(`/api/groups/${params.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd dodawania wydatku");
      }

      // Pobieramy dodany wydatek z odpowiedzią serwera (może zawierać dodatkowe dane)
      const addedExpense = await response.json();

      // Aktualizujemy stan lokalny
      const updatedExpenses = [...expenses, addedExpense];
      setExpenses(updatedExpenses);
      calculateSettlements(updatedExpenses);
      setShowAddForm(false);

      showToast("Wydatek został dodany pomyślnie", "success");
    } catch (err: any) {
      showToast(
        err.message || "Wystąpił błąd podczas dodawania wydatku",
        "error"
      );
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    try {
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

      // Wysyłamy aktualizację do API
      const response = await fetch(
        `/api/groups/${params.id}/expenses/${updatedExpense.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedExpense),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd aktualizacji wydatku");
      }

      // Aktualizujemy stan lokalny
      const updatedExpenses = expenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense
      );

      setExpenses(updatedExpenses);
      calculateSettlements(updatedExpenses);

      showToast("Wydatek został zaktualizowany", "success");
    } catch (err: any) {
      showToast(
        err.message || "Wystąpił błąd podczas aktualizacji wydatku",
        "error"
      );
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      // Wysyłamy żądanie usunięcia do API
      const response = await fetch(
        `/api/groups/${params.id}/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Błąd usuwania wydatku");
      }

      // Aktualizujemy stan lokalny
      const filteredExpenses = expenses.filter(
        (expense) => expense.id !== expenseId
      );
      setExpenses(filteredExpenses);
      calculateSettlements(filteredExpenses);

      showToast("Wydatek został usunięty", "success");
    } catch (err: any) {
      showToast(
        err.message || "Wystąpił błąd podczas usuwania wydatku",
        "error"
      );
    }
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

    // Obliczenie salda na podstawie wydatków
    currentExpenses.forEach((expense) => {
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

        // Dodaj odpowiednią kwotę każdej osobie, która zapłaciła
        expense.payments.forEach((payment) => {
          if (payment.personId && payment.amount > 0) {
            balances[payment.personId] =
              (balances[payment.personId] || 0) + payment.amount;
          }
        });

        // Odejmij odpowiednią część od każdej osoby, która korzysta z wydatku
        splitBetween.forEach((personId) => {
          balances[personId] = (balances[personId] || 0) - splitAmount;
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

        // Dodaj pełną kwotę osobie, która zapłaciła
        balances[paidBy] = (balances[paidBy] || 0) + amount;

        // Odejmij odpowiednią część od każdej osoby, która korzysta z wydatku
        splitBetween.forEach((personId) => {
          balances[personId] = (balances[personId] || 0) - splitAmount;
        });
      }
    });

    // Zaokrąglamy wartości do 2 miejsc po przecinku, aby uniknąć błędów zaokrąglenia
    Object.keys(balances).forEach((key) => {
      balances[key] = Math.round(balances[key] * 100) / 100;
    });

    // Algorytm rozliczeń
    const newSettlements: any[] = [];
    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < -0.009) // Filtrujemy osoby z ujemnym saldem (dłużnicy)
      .sort(([, a], [, b]) => a - b); // Sortujemy od największego długu do najmniejszego

    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0.009) // Filtrujemy osoby z dodatnim saldem (wierzyciele)
      .sort(([, a], [, b]) => b - a); // Sortujemy od największej wpłaty do najmniejszej

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

    setSettlements(newSettlements);
  };

  const exportToCSV = () => {
    try {
      // Przygotuj dane do eksportu z rozszerzeniem csv (lepiej obsługiwane niż xlsx)
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // Format YYYY-MM-DD
      const filename = `OddajHajs_${groupName.replace(
        /\s+/g,
        "_"
      )}_${dateStr}.csv`;

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
        csvContent += `${fromName};${toName};"${settlement.amount
          .toFixed(2)
          .replace(".", ",")}";\r\n`;
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
              return `${name} (${payment.amount
                .toFixed(2)
                .replace(".", ",")} zł)`;
            })
            .join(", ");

          const splitBetweenNames = expense.splitBetween
            .map((id) => people.find((p) => p.id === id)?.name || id)
            .join(", ");

          csvContent += `${expense.description};"${expense.amount
            .toFixed(2)
            .replace(".", ",")}";${payersList};${splitBetweenNames}\r\n`;
        }
        // Obsługa standardowych płatności
        else {
          const paidByName =
            people.find((p) => p.id === expense.paidBy)?.name || expense.paidBy;
          const splitBetweenNames = expense.splitBetween
            .map((id) => people.find((p) => p.id === id)?.name || id)
            .join(", ");
          csvContent += `${expense.description};"${expense.amount
            .toFixed(2)
            .replace(".", ",")}";${paidByName};${splitBetweenNames}\r\n`;
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl text-white">Ładowanie...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Wymagane logowanie
        </h1>
        <p className="mb-6 text-gray-300">
          Musisz się zalogować, aby zobaczyć rozliczenia tej grupy.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login"
            className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Przejdź do logowania
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md p-8 mx-auto bg-gray-800 rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-500">Błąd</h1>
        <p className="mb-6 text-gray-300">{error}</p>
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Wróć do panelu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          Rozliczenia grupy: {groupName}
        </h1>

        <Link
          href={`/groups/${params.id}`}
          className="flex items-center gap-2 px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <FaArrowLeft className="text-sm" /> Wróć do grupy
        </Link>
      </div>

      {showAddForm && (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Dodaj nowy wydatek do grupy
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          <ExpenseForm
            people={people}
            onAddExpense={addExpense}
            showToast={showToast}
          />
        </div>
      )}

      {expenses.length > 0 ? (
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
      ) : (
        <div className="p-8 text-center bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Brak wydatków
          </h2>
          <p className="mb-6 text-gray-300">
            W tej grupie nie ma jeszcze żadnych wydatków. Dodaj pierwszy
            wydatek, aby rozpocząć rozliczenia.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Dodaj pierwszy wydatek
          </button>
        </div>
      )}

      {showCalculator && (
        <Calculator
          onClose={() => setShowCalculator(false)}
          onApplyResult={() => {}}
        />
      )}

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
