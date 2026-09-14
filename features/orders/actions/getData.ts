"use server";

import db from "@/utils/db"
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { auth } from "@clerk/nextjs/server";

export type Service = {
  id: string;
  name: string;
  price: number;
  type: "WASH" | "DRY" | "OTHERS";
};

export type InventoryItem = {
  id: string;
  name: string;
  price: number;
  type: string;
};

export async function getServicesAction() {
  const tenantId = await getTenantId();
  return db.service.findMany({
    where: { tenantId },
    select: { id: true, name: true, price: true, type: true },
  });
}

export async function getInventoryAction() {
  const tenantId = await getTenantId();
  return db.inventoryItem.findMany({
    where: { tenantId },
    select: { id: true, name: true, price: true },
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