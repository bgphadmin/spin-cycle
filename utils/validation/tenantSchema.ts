
import { z } from "zod";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/utils/timeZones";

const timeZoneSchema = z.string().trim().refine(isValidTimeZone, "Enter a valid IANA time zone.");

export const tenantSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required"),
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  contactPosition: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1, "Address is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
  timeZone: timeZoneSchema.default(DEFAULT_TIME_ZONE),
  subscriptionStatus: z.enum(["REGULAR", "PREMIUM", "INACTIVE"]),
});

export const registerShopSchema = tenantSchema.omit({ subscriptionStatus: true });

export const inviteStaffSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
})

export type TenantSchemaType = z.infer<typeof tenantSchema>;