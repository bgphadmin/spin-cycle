"use server";

import db from "@/utils/db"
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { auth, clerkClient } from "@clerk/nextjs/server";

export type Service = {
  id: string;
  name: string;
  price: number;
  type: "WASH" | "DRY" | "OTHERS" | "FOLDS";
};

export type InventoryItem = {
  id: string;
  name: string;
  price: number;
  type: string;
  unit: string;
  stock: number;
};

export type Customer = {
  id: string;
  name: string;
};

export async function getServicesAction(machineId?: string) {
  const tenantId = machineId
    ? await getMachineTenantId(machineId)
    : await getTenantId();
  return db.service.findMany({
    where: { tenantId },
    select: { id: true, name: true, price: true, type: true },
  });
}

export async function getInventoryAction(machineId?: string) {
  const tenantId = machineId
    ? await getMachineTenantId(machineId)
    : await getTenantId();
  return db.inventoryItem.findMany({
    where: { tenantId },
    select: { id: true, name: true, price: true, unit: true, stock: true },
  });
}

export async function getCustomersAction(machineId?: string) {
  const tenantId = machineId
    ? await getMachineTenantId(machineId)
    : await getTenantId();
  return db.customer.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

async function getTenantId() {
  const { userId } = await auth();
  const { orgId } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return tenant.id;
}

async function getMachineTenantId(machineId: string) {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Authentication is required.");

  const machine = await db.machine.findUnique({
    where: { id: machineId },
    select: { tenantId: true, tenant: { select: { clerkOrgId: true } } },
  });
  if (!machine) throw new Error("Machine not found.");

  if (orgId === machine.tenant.clerkOrgId) {
    return machine.tenantId;
  }

  const clerk = await clerkClient();
  const memberships = await clerk.users.getOrganizationMembershipList({ userId });
  const belongsToMachineTenant = memberships.data.some(
    (membership) => membership.organization.id === machine.tenant.clerkOrgId,
  );
  if (!belongsToMachineTenant) {
    throw new Error("Machine does not belong to an organization for this user.");
  }

  return machine.tenantId;
}