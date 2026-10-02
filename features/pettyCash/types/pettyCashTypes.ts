export type PettyCashRow = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  cashDate: string;
  cashDateLabel: string;
  createdAt: string;
  userName: string;
  isExpenseLinked: boolean;
  sourceExpenseId: string | null;
};

export type PettyCashDetail = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  sourceExpenseId: string | null;
};
