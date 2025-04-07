"use client";

import React, { useState } from "react";

interface CalculatorProps {
  onClose: () => void;
  onApplyResult?: (result: string) => void;
}

export default function Calculator({
  onClose,
  onApplyResult,
}: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);

  const handleNumberClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    num: string
  ) => {
    e.preventDefault();
    if (display === "0" || resetDisplay) {
      setDisplay(num);
      setResetDisplay(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimalClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (resetDisplay) {
      setDisplay("0.");
      setResetDisplay(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDisplay("0");
    setCurrentOperation(null);
    setPreviousValue(null);
  };

  const handleOperation = (
    e: React.MouseEvent<HTMLButtonElement>,
    operation: string
  ) => {
    e.preventDefault();
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(currentValue);
      setCurrentOperation(operation);
      setResetDisplay(true);
    } else {
      const result = calculate(previousValue, currentValue, currentOperation!);
      setPreviousValue(result);
      setDisplay(result.toString());
      setCurrentOperation(operation);
      setResetDisplay(true);
    }
  };

  const handleEquals = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (previousValue === null || currentOperation === null) return;

    const currentValue = parseFloat(display);
    const result = calculate(previousValue, currentValue, currentOperation);

    setDisplay(result.toString());
    setPreviousValue(null);
    setCurrentOperation(null);
    setResetDisplay(true);
  };

  const calculate = (a: number, b: number, operation: string): number => {
    switch (operation) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return a / b;
      default:
        return b;
    }
  };

  const handleApplyResult = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onApplyResult) {
      onApplyResult(display);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-80">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Kalkulator</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="text-gray-400 hover:text-white focus:outline-none"
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
              />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gray-700 rounded-md p-3 mb-4 text-right">
            <div className="text-2xl text-white font-mono">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={(e) => handleClear(e)}
              className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              AC
            </button>
            <button
              onClick={(e) => handleOperation(e, "÷")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              ÷
            </button>
            <button
              onClick={(e) => handleOperation(e, "×")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              ×
            </button>

            {[7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={(e) => handleNumberClick(e, num.toString())}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={(e) => handleOperation(e, "-")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              -
            </button>

            {[4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={(e) => handleNumberClick(e, num.toString())}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={(e) => handleOperation(e, "+")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              +
            </button>

            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={(e) => handleNumberClick(e, num.toString())}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={(e) => handleEquals(e)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              =
            </button>

            <button
              onClick={(e) => handleNumberClick(e, "0")}
              className="col-span-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-md transition-colors"
            >
              0
            </button>
            <button
              onClick={(e) => handleDecimalClick(e)}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-md transition-colors"
            >
              .
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex space-x-2">
          {onApplyResult && (
            <button
              onClick={(e) => handleApplyResult(e)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Zastosuj
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
