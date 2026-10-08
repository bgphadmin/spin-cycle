export type SuperAdminTenantRow = {
  id: string;
  shopName: string;
  contactPerson: string;
  email: string;
  phone: string;
  subscriptionStatus: "REGULAR" | "PREMIUM" | "INACTIVE" | "TRIAL";
  createdAt: string;
  trialEndsAt: string | null;
  machineMonthlyRate: number | null;
  machineCount: number;
};

export function getTenantMonthlyBilling(
  tenant: SuperAdminTenantRow,
  machineMonthlyRate: number,
) {
  if (tenant.subscriptionStatus !== "REGULAR" && tenant.subscriptionStatus !== "PREMIUM") {
    return 0;
  }
  return tenant.machineCount * (tenant.machineMonthlyRate ?? machineMonthlyRate);
}
