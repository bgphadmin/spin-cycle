import { z } from "zod";

export const pettyCashSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required." })
    .max(100, { message: "Name must be 100 characters or less." }),
  amount: z.coerce
    .number({ message: "Amount must be a valid number." })
    .finite()
    .positive({ message: "Amount must be greater than zero." }),
  notes: z
    .union([z.literal(""), z.string().max(500, { message: "Notes must not exceed 500 characters." })])
    .optional(),
});
