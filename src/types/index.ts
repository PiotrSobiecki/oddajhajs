export interface Person {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface ResultsProps {
  people: Person[];
  expenses: Expense[];
  settlements: Settlement[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onExport: () => void;
}

export interface NavbarProps {
  currentStep?: "people" | "expenses" | "results";
  onReset: () => void;
  onShowInstructions: () => void;
  onShowCalculator?: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}
