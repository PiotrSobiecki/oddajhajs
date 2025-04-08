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
  const [calculatorTarget, setCalculatorTarget] = useState<"main" | "edit">(
    "main"
  );

  const getPersonName = (id: string) => {
    return people.find((p) => p.id === id)?.name || id;
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    onUpdateExpense(updatedExpense);
    setEditingExpense(null);
  };

  const handleCalculatorResult = (result: string) => {
    if (calculatorTarget === "edit" && editingExpense) {
      setEditingExpense({
        ...editingExpense,
        amount: parseFloat(result),
      });
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
            <FaFileExport /> <span>Eksportuj</span>
          </button>
        </div>
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
                      <div className="flex justify-center items-center h-full -ml-[100px]">
                        <div className="rounded-full border-2 border-green-500 w-8 h-8 flex items-center justify-center bg-gray-800">
                          <FaArrowRight className="text-sm text-green-500 group-hover:text-green-400 transition-colors" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-white text-left">
                      {getPersonName(settlement.to)}
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">
                      {settlement.amount.toFixed(2)} zł
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
                    <div className="flex gap-4">
                      <div className="relative w-1/2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingExpense.amount}
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
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      <p className="text-gray-400">
                        {expense.amount.toFixed(2)} zł - wyciągnął hajs{" "}
                        {people.find((p) => p.id === expense.paidBy)?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Składają się:{" "}
                        {expense.splitBetween
                          .map((id) => people.find((p) => p.id === id)?.name)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingExpense(expense)}
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
