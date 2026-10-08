import { redirect } from "next/navigation";
import SuperAdminDashboard from "@/features/superAdmin/components/SuperAdminDashboard";
import {
  getSuperAdminMachineMonthlyRate,
  getSuperAdminTenantRows,
  getSuperAdminUserId,
} from "@/features/superAdmin/server";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const userId = await getSuperAdminUserId();
  if (!userId) redirect("/not-allowed");

  const [tenants, machineMonthlyRate] = await Promise.all([
    getSuperAdminTenantRows(),
    getSuperAdminMachineMonthlyRate(),
  ]);
  return (
    <SuperAdminDashboard
      tenants={tenants}
      machineMonthlyRate={machineMonthlyRate}
    />
  );
}
