import { z } from "zod"

export const distributionSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  riceId: z.string().min(1, "Rice selection is required"),
  quantityKg: z.coerce.number().min(1, "Quantity must be at least 1 kg"),
  comment: z.string().optional(),
  dateGiven: z.string().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    {
      message: "Date given must be a valid date",
    }
  ),
})

export type DistributionSchemaType = z.infer<typeof distributionSchema>
