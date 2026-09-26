import { z } from "zod";

export const addServiceSchema = z.object({
  type: z.enum(["WASH", "DRY", "OTHERS", "FOLDS"], {
    message: "Type must be WASH, DRY, OTHERS, or FOLDS",
  }),
  name: z
    .string()
    .min(2, { message: "Service name must be at least 2 characters long" })
    .max(100, { message: "Service name must not exceed 100 characters" }),
  price: z.coerce
    .number({ message: "Price must be a valid number" })
    .finite()
    .nonnegative({ message: "Price cannot be negative" }),
  duration: z
    .union([z.literal(""), z.coerce.number().int().positive()])
    .optional(),
});
