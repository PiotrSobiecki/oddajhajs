"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expense, Payment } from "@/types";
import {
  FaCheck,
  FaTimes,
  FaCalculator,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import Calculator from "./Calculator";

interface ExpenseFormProps {
  people: { id: string; name: string }[];
  onAddExpense: (expense: Expense) => void;
  showToast?: (message: string, type: "success" | "error") => void;
}

export default function ExpenseForm({
  people,
  onAddExpense,
  showToast,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    people.map((person) => person.id)
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<string>("main");

  // Nowy stan dla złożonych płatności
  const [isComplexPayment, setIsComplexPayment] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([
    { personId: "", amount: 0 },
  ]);

  const toggleAll = () => {
    if (splitBetween.length === people.length) {
      setSplitBetween([]);
    } else {
      setSplitBetween(people.map((person) => person.id));
    }
  };

  const addPaymentField = () => {
    // Znajdź osoby, które jeszcze nie są przypisane do płatności
    const availablePeople = people.filter(
      (person) => !payments.some((payment) => payment.personId === person.id)
    );

    // Jeśli są dostępne osoby, dodaj nową płatność
    if (availablePeople.length > 0) {
      setPayments([...payments, { personId: "", amount: 0 }]);
    } else {
      // Jeśli wszyscy już są przypisani, pokaż komunikat
      showToast &&
        showToast("Wszystkie osoby mają już przypisane płatności", "error");
    }
  };

  const removePaymentField = (index: number) => {
    if (payments.length > 1) {
      const newPayments = [...payments];
      newPayments.splice(index, 1);
      setPayments(newPayments);
    }
  };

  const updatePayment = (
    index: number,
    field: "personId" | "amount",
    value: string | number
  ) => {
    const newPayments = [...payments];
    newPayments[index] = {
      ...newPayments[index],
      [field]: field === "amount" ? parseFloat(value as string) || 0 : value,
    };
    setPayments(newPayments);
  };

  const calculateTotalPayments = (): number => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const handleCalculatorResult = (result: string) => {
    if (calculatorTarget === "main") {
      setAmount(result);
    } else {
      // Format: "payment_X" gdzie X to indeks w tablicy payments
      const paymentIndex = parseInt(calculatorTarget.split("_")[1]);
      if (!isNaN(paymentIndex) && paymentIndex < payments.length) {
        updatePayment(paymentIndex, "amount", parseFloat(result));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja dla standardowej płatności
    if (!description || (!amount && !isComplexPayment)) {
      showToast &&
        showToast("Ej no, wypełnij nazwę i kwotę! Nie bądź leń!", "error");
      return;
    }

    // Walidacja dla złożonej płatności
    if (isComplexPayment) {
      // Sprawdź czy wszystkie płatności mają osobę i kwotę
      const invalidPayments = payments.some(
        (p) => !p.personId || p.amount <= 0
      );
      if (invalidPayments) {
        showToast &&
          showToast("Uzupełnij wszystkie dane płatności złożonej", "error");
        return;
      }

      // Sprawdź czy ktokolwiek się składa na wydatek
      if (splitBetween.length === 0) {
        showToast &&
          showToast("Wybierz kto się składa na ten wydatek", "error");
        return;
      }
    } else {
      // Walidacja dla standardowej płatności
      if (!paidBy) {
        showToast && showToast("Wybierz kto zapłacił", "error");
        return;
      }

      if (splitBetween.length === 0) {
        showToast &&
          showToast("Wybierz kto się składa na ten wydatek", "error");
        return;
      }
    }

    const expense: Expense = {
      id: uuidv4(),
      description,
      amount: isComplexPayment ? calculateTotalPayments() : parseFloat(amount),
      paidBy: isComplexPayment ? "" : paidBy, // Dla złożonej płatności, paidBy jest puste
      splitBetween,
      date: new Date().toISOString(),
      isComplexPayment,
      payments: isComplexPayment ? payments : undefined,
    };

    onAddExpense(expense);
    resetForm();
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitBetween(people.map((person) => person.id));
    setIsComplexPayment(false);
    setPayments([{ personId: "", amount: 0 }]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 dark:bg-gray-800 p-6 rounded-lg"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Co żeś kupił/a?
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="np. Żarcie z Żabki, Browary, Flaszka..."
        />
      </div>

      <div className="flex items-center mb-4">
        <input
          id="complex-payment"
          type="checkbox"
          checked={isComplexPayment}
          onChange={() => setIsComplexPayment(!isComplexPayment)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 mr-2"
        />
        <label
          htmlFor="complex-payment"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Płatność złożona (kilka osób płaci różne kwoty)
        </label>
      </div>

      {!isComplexPayment ? (
        // Standardowy formularz płatności
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ile hajsu poszło?
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  // Akceptuj tylko liczby i kropkę
                  const re = /^[0-9]*[.]?[0-9]*$/;
                  if (e.target.value === "" || re.test(e.target.value)) {
                    setAmount(e.target.value);
                  }
                }}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-20"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <span className="text-gray-500 dark:text-gray-400 pr-2">
                  zł
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setCalculatorTarget("main");
                    setShowCalculator(true);
                  }}
                  className="pr-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <FaCalculator className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kto wyciągnął hajs?
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>
                -- Wybierz płacącego --
              </option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        // Formularz płatności złożonej
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kto ile zapłacił?
            </label>
            <button
              type="button"
              onClick={addPaymentField}
              className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 ${
                people.length <= payments.filter((p) => p.personId).length
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                people.length <= payments.filter((p) => p.personId).length
              }
            >
              <FaPlus className="w-3 h-3" /> Dodaj płatność
            </button>
          </div>

          <div className="space-y-3 mt-2">
            {payments.map((payment, index) => (
              <div
                key={index}
                className="md:flex md:gap-2 md:items-center grid grid-cols-1 gap-2"
              >
                <div className="md:flex-1 w-full">
                  <select
                    value={payment.personId}
                    onChange={(e) =>
                      updatePayment(index, "personId", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm truncate"
                  >
                    <option value="" disabled>
                      -- Kto płacił? --
                    </option>
                    {people.map((person) => {
                      // Sprawdź czy osoba jest już wybrana w innej płatności
                      const isAlreadySelected = payments.some(
                        (p, i) => i !== index && p.personId === person.id
                      );

                      return (
                        <option
                          key={person.id}
                          value={person.id}
                          disabled={isAlreadySelected}
                          className={
                            isAlreadySelected
                              ? "text-gray-400 dark:text-gray-600"
                              : ""
                          }
                        >
                          {person.name}
                          {isAlreadySelected ? " (już wybr.)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="relative rounded-md shadow-sm md:flex-1 w-full">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={payment.amount || ""}
                    onChange={(e) => {
                      const re = /^[0-9]*[.]?[0-9]*$/;
                      if (e.target.value === "" || re.test(e.target.value)) {
                        updatePayment(
                          index,
                          "amount",
                          e.target.value ? parseFloat(e.target.value) : 0
                        );
                      }
                    }}
                    className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 pr-2 text-sm">
                      zł
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCalculatorTarget(`payment_${index}`);
                        setShowCalculator(true);
                      }}
                      className="pr-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      <FaCalculator className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePaymentField(index)}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    disabled={payments.length <= 1}
                  >
                    <FaMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
            Suma: {calculateTotalPayments().toFixed(2)} zł
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kto się zrzuca na ten wydatek?
          </label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {splitBetween.length === people.length ? (
              <span className="flex items-center gap-1">
                <FaTimes className="w-3 h-3" /> Odznacz wszystkich
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <FaCheck className="w-3 h-3" /> Zaznacz wszystkich
              </span>
            )}
          </button>
        </div>
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
          {people.map((person) => (
            <label
              key={person.id}
              className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={splitBetween.includes(person.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSplitBetween([...splitBetween, person.id]);
                  } else {
                    setSplitBetween(
                      splitBetween.filter((id: string) => id !== person.id)
                    );
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {person.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Dodaj wydatek do spłaty
        </button>
      </div>

      {showCalculator && (
        <Calculator
          onClose={() => setShowCalculator(false)}
          onApplyResult={handleCalculatorResult}
        />
      )}
    </form>
  );
}
