export const EXPENSE_CATEGORIES = [
  { value: "UTILITIES", label: "Utilities" },
  { value: "SALARY", label: "Salary" },
  { value: "INCENTIVES", label: "Incentives" },
  { value: "RENT", label: "Rent" },
  { value: "GAS_LPG", label: "Gas (LPG)" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "PROMOTIONS", label: "Promotions" },
  { value: "OTHER", label: "Other" },
] as const;

// Sentinel value selected in the UI to reveal a free-text "custom category" input.
export const CUSTOM_CATEGORY_VALUE = "CUSTOM";

export const EXPENSE_CATEGORY_OPTIONS = [
  ...EXPENSE_CATEGORIES,
  { value: CUSTOM_CATEGORY_VALUE, label: "Custom (add your own)" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

export function expenseCategoryLabel(category: string) {
  return EXPENSE_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export function isPresetCategory(category: string) {
  return EXPENSE_CATEGORIES.some((option) => option.value === category);
}

export type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  createdAtLabel: string;
  userName: string;
};

export type ExpenseDetail = {
  id: string;
  category: string;
  amount: number;
  notes: string | null;
  deductFromPettyCash: boolean;
};
