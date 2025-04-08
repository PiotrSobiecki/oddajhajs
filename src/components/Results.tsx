"use client";

import React, { useState } from "react";
import ExpenseForm from "./ExpenseForm";
import Calculator from "./Calculator";
import { ResultsProps, Expense } from "@/types";
import {
  FaTimes,
  FaEdit,
  FaTrash,
  FaPlusCircle,
  FaFileExport,
  FaCalculator,
  FaFileImport,
  FaArrowRight,
  FaLongArrowAltRight,
  FaArrowCircleRight,
  FaCopy,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaShareAlt,
  FaGoogle,
  FaUniversity,
  FaPiggyBank,
  FaMoneyBillWave,
  FaCreditCard,
  FaCoins,
  FaPlus,
} from "react-icons/fa";

interface Person {
  id: string;
  name: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function Results({
  people,
  expenses,
  settlements,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onExport,
  showToast,
}: ResultsProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<string>("main");
  const [showShareOptions, setShowShareOptions] = useState(false);

  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || id;
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    // Walidacja dla złożonych płatności
    if (updatedExpense.isComplexPayment && updatedExpense.payments) {
      // Sprawdzamy, czy wszystkie płatności mają uzupełnione dane
      const invalidPayments = updatedExpense.payments.some(
        (p) => !p.personId || p.amount <= 0
      );
      if (invalidPayments) {
        showToast &&
          showToast("Uzupełnij wszystkie dane płatności złożonej", "error");
        return;
      }

      // Sprawdzamy, czy suma płatności jest większa od zera
      const totalPayments = updatedExpense.payments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      if (totalPayments <= 0) {
        showToast &&
          showToast("Suma płatności musi być większa od zera", "error");
        return;
      }

      // Aktualizujemy kwotę wydatku na podstawie sumy płatności
      updatedExpense.amount = totalPayments;
    } else if (!updatedExpense.isComplexPayment) {
      // Walidacja dla standardowej płatności
      if (!updatedExpense.paidBy) {
        showToast && showToast("Wybierz kto zapłacił", "error");
        return;
      }

      if (updatedExpense.amount <= 0) {
        showToast && showToast("Kwota musi być większa od zera", "error");
        return;
      }
    }

    // Sprawdzamy, czy ktokolwiek się składa na wydatek
    if (updatedExpense.splitBetween.length === 0) {
      showToast && showToast("Wybierz kto się składa na ten wydatek", "error");
      return;
    }

    onUpdateExpense(updatedExpense);
    setEditingExpense(null);
  };

  const handleCalculatorResult = (result: string) => {
    if (!result) return;

    const numericResult = parseFloat(result);
    if (isNaN(numericResult)) return;

    if (calculatorTarget === "main") {
      // Główny kalkulator dla całego formularza
      if (editingExpense) {
        setEditingExpense({
          ...editingExpense,
          amount: numericResult,
        });
      }
    } else if (calculatorTarget === "edit") {
      // Kalkulator dla pola kwoty w standardowej płatności
      if (editingExpense) {
        setEditingExpense({
          ...editingExpense,
          amount: numericResult,
        });
      }
    } else if (calculatorTarget.startsWith("payment_")) {
      // Format: "payment_X" gdzie X to indeks w tablicy payments
      const paymentIndex = parseInt(calculatorTarget.split("_")[1], 10);
      if (
        !isNaN(paymentIndex) &&
        editingExpense?.payments &&
        paymentIndex < editingExpense.payments.length
      ) {
        const updatedPayments = [...editingExpense.payments];
        updatedPayments[paymentIndex] = {
          ...updatedPayments[paymentIndex],
          amount: numericResult,
        };

        setEditingExpense({
          ...editingExpense,
          payments: updatedPayments,
        });
      }
    }

    setShowCalculator(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (
      window.confirm(
        "Jesteś pewien? To zniknie na zawsze (no, chyba że wpiszesz ponownie)"
      )
    ) {
      onDeleteExpense(expenseId);
    }
  };

  // Funkcja generująca tekst do udostępnienia
  const generateShareText = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString(); // Format lokalny daty

    let text = `Rozliczenie z wyjazdu/imprezy (${dateStr}):\n\n`;

    if (settlements.length === 0) {
      text += "Wszyscy kwita! Nikt nikomu nic nie musi oddawać. 👍";
    } else {
      text += "Kto komu ma oddać hajs:\n";
      settlements.forEach((settlement) => {
        const fromName = getPersonName(settlement.from);
        const toName = getPersonName(settlement.to);
        const amount = settlement.amount.toFixed(2);
        text += `${fromName} → ${toName}: ${amount} zł\n`;
      });
    }

    text += "\n-- Rozliczenie wygenerowane przez oddajhajs.org --";
    return text;
  };

  // Funkcja kopiująca tekst do schowka
  const copyToClipboard = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(
      () => {
        showToast && showToast("Skopiowano do schowka!", "success");
        setShowShareOptions(false);
      },
      (err) => {
        console.error("Nie udało się skopiować tekstu: ", err);
        showToast && showToast("Nie udało się skopiować tekstu", "error");
      }
    );
  };

  // Funkcje udostępniania do różnych komunikatorów
  const shareToWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareOptions(false);
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(
      `https://t.me/share/url?url=oddajhajs.org&text=${text}`,
      "_blank"
    );
    setShowShareOptions(false);
  };

  const shareByDefaultEmail = () => {
    const subject = encodeURIComponent(
      "Rozliczenie z wyjazdu/imprezy - oddajhajs.org"
    );
    const body = encodeURIComponent(generateShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareOptions(false);
  };

  const shareByGmail = () => {
    const subject = encodeURIComponent(
      "Rozliczenie z wyjazdu/imprezy - oddajhajs.org"
    );
    const body = encodeURIComponent(generateShareText());
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      "_blank"
    );
    setShowShareOptions(false);
  };

  const handleEditClick = (expense: Expense) => {
    // Przekształcamy standardową płatność na złożoną, jeśli to konieczne
    const editExpense = { ...expense };

    if (editExpense.isComplexPayment && !editExpense.payments) {
      // W przypadku braku danych o płatnościach, inicjalizuj puste
      editExpense.payments = [];
    } else if (!editExpense.isComplexPayment && editExpense.paidBy) {
      // Zawsze inicjalizujemy tablicę payments nawet dla standardowej płatności
      // żeby można było przełączyć na złożoną płatność podczas edycji
      editExpense.payments = [
        {
          personId: editExpense.paidBy,
          amount: editExpense.amount,
        },
      ];
    }

    // Upewnij się, że zawsze jest przynajmniej jedna płatność
    if (!editExpense.payments || editExpense.payments.length === 0) {
      editExpense.payments = [{ personId: "", amount: 0 }];
    }

    setEditingExpense(editExpense);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-white">
          Kto komu ma oddać hajs?
        </h1>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FaPlusCircle /> <span>Dodaj wydatek</span>
          </button>
          <button
            onClick={onExport}
            className="w-full sm:w-auto px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <FaFileExport /> <span>Eksportuj do csv</span>
          </button>
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="w-full sm:w-auto px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <FaShareAlt /> <span>Udostępnij</span>
          </button>
        </div>

        {showShareOptions && (
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <h3 className="text-white font-medium mb-3">
              Udostępnij rozliczenie:
            </h3>
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-5 md:gap-2">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FaCopy />
                <span>Kopiuj</span>
              </button>
              <div className="grid grid-cols-2 gap-2 md:contents">
                <button
                  onClick={shareToWhatsApp}
                  className="flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={shareToTelegram}
                  className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  <FaTelegram />
                  <span>Telegram</span>
                </button>
                <button
                  onClick={shareByGmail}
                  className="flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <FaGoogle />
                  <span>Gmail</span>
                </button>
                <button
                  onClick={shareByDefaultEmail}
                  className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <FaEnvelope />
                  <span>Outlook</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Kto komu płaci?
        </h2>
        {settlements.length === 0 ? (
          <div className="text-gray-400">
            <p>Wszyscy kwita! Jak to możliwe?</p>
            <ul className="list-disc ml-6 mt-2 text-sm">
              <li>Każdy mógł wydać podobną kwotę</li>
              <li>Wydatki mogły zostać podzielone bardzo równomiernie</li>
              <li>Wszyscy mogli równo się składać na te same rzeczy</li>
              <li>
                Jeśli to błąd, sprawdź czy dane zostały poprawnie zaimportowane
              </li>
            </ul>
            <p className="mt-2">
              Jeśli uważasz, że powinny być rozliczenia, sprawdź wydatki poniżej
              i upewnij się, że wszystkie dane są poprawne.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col className="w-[39%]" />
                <col className="w-[6%]" />
                <col className="w-[39%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-2 text-gray-300">
                    Kto oddaje
                  </th>
                  <th className="text-center py-3 px-0 text-gray-300"></th>
                  <th className="text-left py-3 px-2 text-gray-300">
                    Komu oddaje
                  </th>
                  <th className="text-right py-3 px-2 text-gray-300">
                    Ile hajsu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {settlements.map((settlement, index) => (
                  <tr key={index} className="hover:bg-gray-700 group">
                    <td className="py-3 px-2 text-white text-left">
                      {getPersonName(settlement.from)}
                    </td>
                    <td className="py-3 px-0">
                      <div className="flex justify-center items-center h-full ">
                        <div className="rounded-full border-2 border-green-500 w-8 h-8 flex items-center justify-center bg-gray-800">
                          <FaArrowRight className="text-sm text-green-500 group-hover:text-green-400 transition-colors" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-white text-left">
                      {getPersonName(settlement.to)}
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">
                      <div className="flex flex-col items-end">
                        <span>{settlement.amount.toFixed(2)} zł</span>
                        {/* Tymczasowo ukryte ikony banków
                        <div className="flex mt-1 space-x-2">
                          <a
                            href="https://www.pkobp.pl/klient-indywidualny/aplikacja-iko-ipko/aplikacja-mobilna-iko"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="PKO BP - IKO"
                            className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors"
                          >
                            <FaUniversity size={12} />
                          </a>
                          <a
                            href="https://www.mbank.pl/indywidualny/aplikacja-i-serwis/o-aplikacji/"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="mBank"
                            className="flex items-center justify-center w-6 h-6 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors"
                          >
                            <FaMoneyBillWave size={12} />
                          </a>
                          <a
                            href="https://www.santander.pl/klient-indywidualny/bankowosc-internetowa/santander-mobile?santag-camp=advnav-baner_OneAppLaunch_0923"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Santander"
                            className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-400 transition-colors"
                          >
                            <FaPiggyBank size={12} />
                          </a>
                          <a
                            href="https://www.ing.pl/indywidualni/aplikacja-mobilna"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="ING"
                            className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white rounded-full hover:bg-orange-400 transition-colors"
                          >
                            <FaCreditCard size={12} />
                          </a>
                          <a
                            href="https://www.pekao.com.pl/klient-indywidualny/bankowosc-elektroniczna/Peopay.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Pekao - PeoPay"
                            className="flex items-center justify-center w-6 h-6 bg-red-700 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <FaCoins size={12} />
                          </a>
                        </div>
                        */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              Wrzuć nowy wydatek do puli
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
          <ExpenseForm
            people={people}
            onAddExpense={(expense) => {
              onAddExpense(expense);
              setShowAddForm(false);
            }}
            showToast={showToast}
          />
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Lista wydatków
        </h2>
        {expenses.length === 0 ? (
          <p className="text-gray-400">
            Jeszcze nie ma wydatków. Ktoś tu jest skąpy czy co?
          </p>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="border-b border-gray-700 pb-4 last:border-b-0"
              >
                {editingExpense?.id === expense.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingExpense.description}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="Co to za wydatek?"
                    />

                    <div className="flex items-center mb-2">
                      <input
                        id="complex-payment-edit"
                        type="checkbox"
                        checked={editingExpense.isComplexPayment}
                        onChange={() => {
                          if (!editingExpense.isComplexPayment) {
                            // Przełączamy z prostej na złożoną
                            let payments = editingExpense.payments || [];
                            if (
                              editingExpense.paidBy &&
                              payments.length === 0
                            ) {
                              // Tworzymy płatność na podstawie standardowej
                              payments = [
                                {
                                  personId: editingExpense.paidBy,
                                  amount: editingExpense.amount,
                                },
                              ];
                            }
                            setEditingExpense({
                              ...editingExpense,
                              isComplexPayment: true,
                              payments: payments.length
                                ? payments
                                : [{ personId: "", amount: 0 }],
                              paidBy: "", // Czyścimy pole paidBy dla złożonej płatności
                            });
                          } else {
                            // Przełączamy ze złożonej na prostą
                            const firstPayment = editingExpense.payments?.[0];
                            setEditingExpense({
                              ...editingExpense,
                              isComplexPayment: false,
                              paidBy: firstPayment?.personId || "", // Używamy pierwszej płatności jako paidBy
                              amount: firstPayment?.amount || 0, // Używamy kwoty pierwszej płatności
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded dark:bg-gray-700 dark:border-gray-600 mr-2"
                      />
                      <label
                        htmlFor="complex-payment-edit"
                        className="text-sm font-medium text-gray-300"
                      >
                        Płatność złożona (kilka osób płaci różne kwoty)
                      </label>
                    </div>

                    {editingExpense.isComplexPayment ? (
                      // Edycja złożonej płatności
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-gray-300 mb-1">
                          Płatności:
                        </div>
                        {editingExpense.payments?.map((payment, index) => (
                          <div key={index} className="flex gap-4 items-center">
                            <select
                              value={payment.personId}
                              onChange={(e) => {
                                const newPayments = [
                                  ...(editingExpense.payments || []),
                                ];
                                newPayments[index] = {
                                  ...newPayments[index],
                                  personId: e.target.value,
                                };
                                setEditingExpense({
                                  ...editingExpense,
                                  payments: newPayments,
                                });
                              }}
                              className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            >
                              <option value="">Wybierz osobę</option>
                              {people.map((person) => {
                                const isSelected =
                                  editingExpense.payments?.some(
                                    (p, i) =>
                                      i !== index && p.personId === person.id
                                  );
                                return (
                                  <option
                                    key={person.id}
                                    value={person.id}
                                    disabled={
                                      isSelected &&
                                      person.id !== payment.personId
                                    }
                                  >
                                    {person.name}{" "}
                                    {isSelected &&
                                    person.id !== payment.personId
                                      ? "(już wybrany)"
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="relative w-1/2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={payment.amount || ""}
                                onChange={(e) => {
                                  const re = /^[0-9]*[.]?[0-9]*$/;
                                  if (
                                    e.target.value === "" ||
                                    re.test(e.target.value)
                                  ) {
                                    const newPayments = [
                                      ...(editingExpense.payments || []),
                                    ];
                                    newPayments[index] = {
                                      ...newPayments[index],
                                      amount: e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    };
                                    setEditingExpense({
                                      ...editingExpense,
                                      payments: newPayments,
                                    });
                                  }
                                }}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white pr-16"
                                placeholder="0.00"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center">
                                <span className="text-gray-400 pr-2">zł</span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCalculatorTarget(`payment_${index}`);
                                    setShowCalculator(true);
                                  }}
                                  className="pr-3 text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                  <FaCalculator className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  (editingExpense.payments?.length || 0) > 1
                                ) {
                                  const newPayments = [
                                    ...(editingExpense.payments || []),
                                  ];
                                  newPayments.splice(index, 1);
                                  setEditingExpense({
                                    ...editingExpense,
                                    payments: newPayments,
                                  });
                                }
                              }}
                              className="p-2 text-red-400 hover:text-red-300"
                              disabled={
                                (editingExpense.payments?.length || 0) <= 1
                              }
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const availablePeople = people.filter(
                              (person) =>
                                !(editingExpense.payments || []).some(
                                  (p) => p.personId === person.id
                                )
                            );

                            if (availablePeople.length > 0) {
                              setEditingExpense({
                                ...editingExpense,
                                payments: [
                                  ...(editingExpense.payments || []),
                                  {
                                    personId: availablePeople[0].id, // Automatycznie wybierz pierwszą dostępną osobę
                                    amount: 0,
                                  },
                                ],
                              });
                            } else {
                              showToast &&
                                showToast(
                                  "Wszystkie osoby mają już przypisane płatności",
                                  "error"
                                );
                            }
                          }}
                          disabled={
                            people.length <=
                            (editingExpense.payments?.length || 0)
                          }
                          className={`px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 ${
                            people.length <=
                            (editingExpense.payments?.length || 0)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <FaPlus className="w-3 h-3" /> Dodaj płatność
                        </button>

                        <div className="text-right text-sm text-gray-300">
                          Suma płatności:{" "}
                          {editingExpense.payments
                            ?.reduce((sum, p) => sum + (p.amount || 0), 0)
                            .toFixed(2)}{" "}
                          zł
                        </div>
                      </div>
                    ) : (
                      // Edycja standardowej płatności
                      <div className="flex gap-4">
                        <div className="relative w-1/2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingExpense.amount || ""}
                            onChange={(e) => {
                              const re = /^[0-9]*[.]?[0-9]*$/;
                              if (
                                e.target.value === "" ||
                                re.test(e.target.value)
                              ) {
                                setEditingExpense({
                                  ...editingExpense,
                                  amount: e.target.value
                                    ? parseFloat(e.target.value)
                                    : 0,
                                });
                              }
                            }}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white pr-16"
                            placeholder="Ile hajsu?"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center">
                            <span className="text-gray-400 pr-2">zł</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCalculatorTarget("edit");
                                setShowCalculator(true);
                              }}
                              className="pr-3 text-gray-400 hover:text-blue-400 transition-colors"
                            >
                              <FaCalculator className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <select
                          value={editingExpense.paidBy}
                          onChange={(e) =>
                            setEditingExpense({
                              ...editingExpense,
                              paidBy: e.target.value,
                            })
                          }
                          className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="">Wybierz kto zapłacił</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Kto się składa?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {people.map((person) => (
                          <label
                            key={person.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={editingExpense.splitBetween.includes(
                                person.id
                              )}
                              onChange={(e) => {
                                const newSplitBetween = e.target.checked
                                  ? [...editingExpense.splitBetween, person.id]
                                  : editingExpense.splitBetween.filter(
                                      (id) => id !== person.id
                                    );
                                setEditingExpense({
                                  ...editingExpense,
                                  splitBetween: newSplitBetween,
                                });
                              }}
                              className="h-4 w-4 bg-gray-700 border-gray-600"
                            />
                            <span className="text-gray-300">{person.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingExpense(null)}
                        className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                      >
                        Jednak nie
                      </button>
                      <button
                        onClick={() => handleUpdateExpense(editingExpense)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Zapisz zmiany
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">
                        {expense.description}
                      </h3>
                      {expense.isComplexPayment ? (
                        // Wyświetlanie złożonej płatności
                        <div>
                          <p className="text-gray-400">
                            {expense.amount.toFixed(2)} zł - płatność złożona
                          </p>
                          <div className="text-sm text-gray-500">
                            <p>Wpłacający:</p>
                            <ul className="list-disc ml-5">
                              {expense.payments?.map((payment, idx) => (
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
                          </div>
                        </div>
                      ) : (
                        // Wyświetlanie standardowej płatności
                        <p className="text-gray-400">
                          {expense.amount.toFixed(2)} zł - wyciągnął hajs{" "}
                          {people.find((p) => p.id === expense.paidBy)?.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Składają się:{" "}
                        {expense.splitBetween
                          .map((id) => people.find((p) => p.id === id)?.name)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          handleEditClick(expense);
                        }}
                        className="p-2 text-blue-400 hover:text-blue-300"
                        title="Edytuj"
                      >
                        <FaEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                        title="Usuń"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCalculator && (
        <Calculator
          onClose={() => setShowCalculator(false)}
          onApplyResult={handleCalculatorResult}
        />
      )}
    </div>
  );
}
