import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import type { SuperAdminTenantRow } from "./types";

export async function getSuperAdminUserId() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "SUPERUSER" ? userId : null;
}

export async function requireSuperAdmin() {
  const userId = await getSuperAdminUserId();
  if (!userId) throw new Error("Only Super Admins can manage tenants.");
  return userId;
}

export async function getSuperAdminTenantRows(): Promise<SuperAdminTenantRow[]> {
  const userId = await getSuperAdminUserId();
  if (!userId) throw new Error("Only Super Admins can view the tenant dashboard.");

  const tenants = await db.tenant.findMany({
    orderBy: { shopName: "asc" },
    select: {
      id: true,
      shopName: true,
      contactPerson: true,
      email: true,
      phone: true,
      subscriptionStatus: true,
      createdAt: true,
      trialEndsAt: true,
      machineMonthlyRate: true,
      _count: { select: { machines: true } },
    },
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    shopName: tenant.shopName,
    contactPerson: tenant.contactPerson,
    email: tenant.email,
    phone: tenant.phone,
    subscriptionStatus: tenant.subscriptionStatus,
    createdAt: tenant.createdAt.toISOString(),
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    machineMonthlyRate: tenant.machineMonthlyRate?.toNumber() ?? null,
    machineCount: tenant._count.machines,
  }));
}

export async function getSuperAdminMachineMonthlyRate(): Promise<number> {
  await requireSuperAdmin();
  const setting = await db.systemSetting.findUnique({
    where: { id: "global" },
    select: { machineMonthlyRate: true },
  });
  if (!setting) {
    throw new Error("The global machine monthly rate has not been configured.");
  }
  return setting.machineMonthlyRate.toNumber();
}
