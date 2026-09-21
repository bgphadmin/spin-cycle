import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required." }).max(100, { message: "Name must be 100 characters or less." }),
  phone: z.union([z.literal(""), z.string().trim().max(30, { message: "Phone must be 30 characters or less." })]),
  email: z.union([z.literal(""), z.string().trim().email({ message: "Email must be valid." }).max(255, { message: "Email must be 255 characters or less." })]),
});
