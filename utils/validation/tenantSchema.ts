
import { z } from "zod";

export const tenantSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactPosition: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().optional(),
  subscriptionStatus: z.enum(["REGULAR", "PREMIUM", "INACTIVE"]),
});

export type TenantSchemaType = z.infer<typeof tenantSchema>;