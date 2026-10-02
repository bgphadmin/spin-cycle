export type PettyCashRow = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
  cashDate: string;
  cashDateLabel: string;
  createdAt: string;
  userName: string;
};

export type PettyCashDetail = {
  id: string;
  name: string;
  amount: number;
  notes: string | null;
};
