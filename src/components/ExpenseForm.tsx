"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Expense } from "@/types";
import { FaCheck, FaTimes, FaCalculator } from "react-icons/fa";
import Calculator from "./Calculator";

interface ExpenseFormProps {
  people: { id: string; name: string }[];
  onAddExpense: (expense: Expense) => void;
}

export default function ExpenseForm({
  people,
  onAddExpense,
}: ExpenseFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    people.map((person) => person.id)
  );
  const [showCalculator, setShowCalculator] = useState(false);

  const toggleAll = () => {
    if (splitBetween.length === people.length) {
      setSplitBetween([]);
    } else {
      setSplitBetween(people.map((person) => person.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !paidBy || splitBetween.length === 0) {
      alert("Ej no, wypełnij wszystkie pola! Nie bądź leń!");
      return;
    }

    const expense: Expense = {
      id: uuidv4(),
      description,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
      date: new Date().toISOString(),
    };

    onAddExpense(expense);
    setDescription("");
    setAmount("");
    setPaidBy("");
    setSplitBetween(people.map((person) => person.id));
  };

  const handleCalculatorResult = (result: string) => {
    setAmount(result);
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
            <span className="text-gray-500 dark:text-gray-400 pr-2">zł</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
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
                      splitBetween.filter((id) => id !== person.id)
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
