export interface Person {
  id: string;
  name: string;
}

export interface ImportedExpenseData {
  paidByName: string;
  splitBetweenNames: string[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  payments?: Payment[];
  isComplexPayment?: boolean;
  date?: string;
  importedData?: ImportedExpenseData;
}

export interface Payment {
  personId: string;
  amount: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface NavbarProps {
  currentStep: "people" | "expenses" | "results";
  onReset: () => void;
  onShowInstructions: () => void;
  onShowCalculator?: () => void;
}

export interface ExpenseFormProps {
  people: Person[];
  onAddExpense: (expense: Expense) => void;
}

export interface ResultsProps {
  people: Person[];
  expenses: Expense[];
  settlements: Settlement[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (updatedExpense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onExport: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
}
