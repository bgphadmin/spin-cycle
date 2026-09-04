import { z } from "zod"

export const stockLogSchema = z.object({
  riceId: z.string().min(1, "Rice selection is required"),
  quantityKg: z.coerce.number().int().min(1, "Quantity must be at least 1 kg"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  supplierId: z.string().optional(),
  comment: z.string().optional(),
  action: z.enum(["ADD", "REMOVE"]),
})

export type StockLogSchemaType = z.infer<typeof stockLogSchema>
