export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export type CustomerDetail = Omit<CustomerRow, "createdAt">;
