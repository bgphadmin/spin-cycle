import { z } from "zod";

export const addMachineSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Machine name must be at least 2 characters long" })
    .max(50, { message: "Machine name must not exceed 50 characters" }),

  // ✅ Correct usage of z.enum
  type: z.enum(["washer", "dryer"], {
    message: "Type must be either washer or dryer",
  }),

  usageCount: z.coerce
    .number()
    .int({ message: "Initial usage count must be a whole number" })
    .min(0, { message: "Initial usage count cannot be negative" }),

  maintenanceEnabled: z.preprocess(
    (value) => value === true || value === "on" || value === "true",
    z.boolean(),
  ).default(false),

  maintenanceIntervalCycles: z.coerce
    .number()
    .int({ message: "Maintenance interval must be a whole number" })
    .min(1, { message: "Maintenance interval must be at least one cycle" })
    .max(1000000, { message: "Maintenance interval cannot exceed 1,000,000 cycles" })
    .default(3000),

  location: z
    .string()
    .max(100, { message: "Location must not exceed 100 characters" })
    .optional(),

  comment: z
    .string()
    .max(255, { message: "Comment must not exceed 255 characters" })
    .optional(),
});