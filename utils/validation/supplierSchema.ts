
import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name must be at least 1 character"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierSchemaType = z.infer<typeof supplierSchema>;