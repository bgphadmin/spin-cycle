// src/utils/validation/riceSchema.ts
import { comment } from "postcss";
import { z } from "zod";

export const riceSchema = z.object({
  name: z.string().min(2, "Rice name must be at least 2 characters"),
  stockKg: z.coerce.number().min(0, "Stock must be at least 0 kg"),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative"),
  comment: z.string().optional(),
});

export type RiceSchemaType = z.infer<typeof riceSchema>;