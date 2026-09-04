// src/utils/validation/riceSchema.ts

import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  role: z.enum(["ADMIN", "USER", "SUPERUSER"]),
});

export type UserSchemaType = z.infer<typeof userSchema>;