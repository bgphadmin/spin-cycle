// Define validation schema
import { z } from "zod";

export const orderSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
  customerName: z.string().min(2, "Customer name is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  paymentMethod: z.enum(["cash", "card", "gcash"]),
  inventoryItemId: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
})

