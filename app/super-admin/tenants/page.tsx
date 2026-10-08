import { redirect } from "next/navigation";
import TenantManager from "@/components/tenant/TenantManager";
import type { TenantRow } from "@/components/tenant/TenantGrid";
import SuperAdminTabs from "@/features/superAdmin/components/SuperAdminTabs";
import { getSuperAdminUserId } from "@/features/superAdmin/server";
import db from "@/utils/db";

export const dynamic = "force-dynamic";

export default async function SuperAdminTenantsPage() {
  const userId = await getSuperAdminUserId();
  if (!userId) redirect("/not-allowed");

  const [tenants, total] = await Promise.all([
    db.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.tenant.count(),
  ]);
  const initialRows: TenantRow[] = tenants.map((tenant) => ({
    ...tenant,
    machineMonthlyRate: tenant.machineMonthlyRate?.toNumber() ?? null,
  }));

  return (
    <main className="mx-auto mb-24 mt-8 w-full max-w-7xl space-y-6 px-4 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold text-teal-800">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage tenants and their subscription information.
        </p>
      </header>
      <SuperAdminTabs activeTab="tenants" />
      <TenantManager initialRows={initialRows} total={total} />
    </main>
  );
}
