"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import {
  businessDateKey,
  businessDateKeyToUtcDate,
  getBusinessMonthStart,
} from "@/utils/businessDate";
import { pettyCashSchema } from "@/utils/validation/pettyCashSchema";
import type {
  PettyCashDetail,
  PettyCashRow,
} from "@/features/pettyCash/types/pettyCashTypes";

async function getTenantContext() {
  const { userId } = await auth();
  const { orgId, orgSlug } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return { ...tenant, userId, orgSlug };
}

async function getCurrentUser(tenant: { id: string; userId: string }) {
  const { orgRole } = await getServerAuthClaims();
  const user = await db.user.findFirst({
    where: { clerkId: tenant.userId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!user) throw new Error("Your staff profile was not found for this shop.");
  return { id: user.id, isAdmin: orgRole === "org:admin" };
}

export async function getPettyCashListDefaultsAction() {
  const tenant = await getTenantContext();
  const now = new Date();

  return {
    startDate: businessDateKey(getBusinessMonthStart(now, tenant.timeZone), tenant.timeZone),
    endDate: businessDateKey(now, tenant.timeZone),
    timeZone: tenant.timeZone,
  };
}

export async function getPettyCashAction({
  startDate,
  endDate,
}: { startDate?: string; endDate?: string } = {}): Promise<{
  entries: PettyCashRow[];
  totalAmount: number;
}> {
  const tenant = await getTenantContext();
  const currentUser = await getCurrentUser(tenant);
  const now = new Date();
  const startKey =
    startDate || businessDateKey(getBusinessMonthStart(now, tenant.timeZone), tenant.timeZone);
  const endKey = endDate || businessDateKey(now, tenant.timeZone);
  const dateRange = {
    cashDate: {
      gte: businessDateKeyToUtcDate(startKey),
      lte: businessDateKeyToUtcDate(endKey),
    },
  };
  const [entries, total] = await Promise.all([
    db.pettyCash.findMany({
      where: {
        tenantId: tenant.id,
        ...dateRange,
        ...(currentUser.isAdmin ? {} : { userId: currentUser.id }),
      },
      orderBy: [{ cashDate: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true } } },
    }),
    db.pettyCash.aggregate({
      where: {
        tenantId: tenant.id,
        ...dateRange,
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalAmount: total._sum.amount ?? 0,
    entries: entries.map((entry) => {
      const cashDate = entry.cashDate.toISOString().slice(0, 10);
      return {
        id: entry.id,
        name: entry.name,
        amount: entry.amount,
        notes: entry.notes,
        cashDate,
        cashDateLabel: new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeZone: "UTC",
        }).format(entry.cashDate),
        createdAt: entry.createdAt.toISOString(),
        userName: entry.user.name,
      };
    }),
  };
}

export async function getPettyCashByIdAction(id: string): Promise<PettyCashDetail | null> {
  const tenant = await getTenantContext();
  const currentUser = await getCurrentUser(tenant);
  const entry = await db.pettyCash.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, name: true, amount: true, notes: true, userId: true },
  });
  if (!entry || (!currentUser.isAdmin && entry.userId !== currentUser.id)) return null;
  return { id: entry.id, name: entry.name, amount: entry.amount, notes: entry.notes };
}

export async function addPettyCashAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const fields = pettyCashSchema.parse({
      name: formData.get("name"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const createdAt = new Date();
    const rawCashDate = String(formData.get("cashDate") ?? "").trim();
    if (rawCashDate && !currentUser.isAdmin) {
      throw new Error("Only admins can set a petty cash date.");
    }
    const cashDate = rawCashDate
      ? businessDateKeyToUtcDate(rawCashDate)
      : businessDateKeyToUtcDate(businessDateKey(createdAt, tenant.timeZone));

    const entry = await db.pettyCash.create({
      data: {
        tenantId: tenant.id,
        userId: currentUser.id,
        name: fields.name,
        amount: fields.amount,
        notes: fields.notes === "" ? null : fields.notes,
        createdAt,
        cashDate,
      },
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/pettyCash`);
    return {
      message: JSON.stringify([
        { message: "Petty cash entry added successfully.", result: "success" },
        { pettyCashId: entry.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding petty cash entry:", error);
    return renderError(error);
  }
}

export async function updatePettyCashAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("Petty cash entry id is required.");

    const existing = await db.pettyCash.findFirst({
      where: { id, tenantId: tenant.id },
      select: { userId: true },
    });
    if (!existing) throw new Error("Petty cash entry not found.");
    if (!currentUser.isAdmin && existing.userId !== currentUser.id) {
      throw new Error("You can only edit petty cash entries you added yourself.");
    }

    const fields = pettyCashSchema.parse({
      name: formData.get("name"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const entry = await db.pettyCash.update({
      where: { id, tenantId: tenant.id },
      data: {
        name: fields.name,
        amount: fields.amount,
        notes: fields.notes === "" ? null : fields.notes,
      },
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/pettyCash`);
    return {
      message: JSON.stringify([
        { message: "Petty cash entry updated successfully.", result: "success" },
        { pettyCashId: entry.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error updating petty cash entry:", error);
    return renderError(error);
  }
}

export async function deletePettyCashAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("Petty cash entry id is required.");

    const existing = await db.pettyCash.findFirst({
      where: { id, tenantId: tenant.id },
      select: { userId: true },
    });
    if (!existing) throw new Error("Petty cash entry not found.");
    if (!currentUser.isAdmin && existing.userId !== currentUser.id) {
      throw new Error("You can only delete petty cash entries you added yourself.");
    }

    await db.pettyCash.delete({ where: { id, tenantId: tenant.id } });
    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/pettyCash`);
    return { message: "Petty cash entry deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting petty cash entry:", error);
    return {
      message: error instanceof Error ? error.message : "Unable to delete petty cash entry.",
    };
  }
}
