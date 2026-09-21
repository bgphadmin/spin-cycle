import { z } from "zod";

export const addExpenseSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, { message: "Category is required." })
    .max(40, { message: "Category must be 40 characters or less." }),
  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .finite()
    .positive({ message: "Amount must be greater than zero" }),
  notes: z
    .union([z.literal(""), z.string().max(500, { message: "Notes must not exceed 500 characters" })])
    .optional(),
});
