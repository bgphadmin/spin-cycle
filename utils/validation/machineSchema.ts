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

  location: z
    .string()
    .max(100, { message: "Location must not exceed 100 characters" })
    .optional(),

  comment: z
    .string()
    .max(255, { message: "Comment must not exceed 255 characters" })
    .optional(),
});