import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Inventory item name must be at least 2 characters long" })
    .max(100, { message: "Inventory item name must not exceed 100 characters" }),
  type: z.enum(["retail", "consumable"], {
    message: "Type must be either retail or consumable",
  }),
  unit: z
    .string()
    .min(1, { message: "Unit is required" })
    .max(30, { message: "Unit must not exceed 30 characters" }),
  stock: z.coerce.number().int().nonnegative({ message: "Stock cannot be negative" }),
  price: z.coerce.number().finite().nonnegative({ message: "Price cannot be negative" }),
});
