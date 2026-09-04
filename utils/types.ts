export type actionFunction = (
  prevState: unknown,
  formData: FormData
) => Promise<{ message: string }>;

export type RiceOption = {
  id: string;
  name: string;
};

export type DistributionRow = {
  id: string;
  employee: { id: string; firstName: string; lastName: string };
  rice: { name: string; id: string };
  quantityKg: number;
  comment: string | null;
  dateGiven: string;
  createdBy: { firstName: string; lastName: string };
};

export type StockLog = {
  id: string;
  riceId: string;
  supplierId: string;
  rice: { name: string; id: string };
  supplier: { name: string; id: string };
  price: number;
  quantityKg: number;
  action: "ADD" | "REMOVE";
  comment?: string | null | undefined;
  createdAt: string;
  createdById: string;
  createdBy: { firstName: string; lastName: string };
};