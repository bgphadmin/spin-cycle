"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import db from "@/utils/db";
import { getAuthContext } from "@/lib/auth";
import { renderError } from "@/utils/error";

async function getAdminTenantContext(tenantSlug: string) {
  const { userId } = await getAuthContext();
  if (!userId) throw new Error("Sign in to manage LPG cylinders.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgSlug: tenantSlug },
    select: { id: true, clerkOrgSlug: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found.");

  const admin = await db.user.findFirst({
    where: { clerkId: userId, tenantId: tenant.id, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("Only tenant admins can manage LPG cylinders.");

  return tenant;
}

export async function getLpgCylinderReportAction(tenantSlug: string) {
  const tenant = await getAdminTenantContext(tenantSlug);
  const cylinders = await db.lpgCylinder.findMany({
    where: { tenantId: tenant.id },
    orderBy: { filledAt: "desc" },
    take: 100,
    select: { id: true, filledAt: true, emptiedAt: true, note: true },
  });

  if (cylinders.length === 0) {
    return { cylinders: [], timeZone: tenant.timeZone };
  }

  const dryOrders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      status: "COMPLETED",
      machineUsages: {
        some: {
          cycleType: "DRY",
          startedAt: { gte: cylinders[cylinders.length - 1].filledAt },
        },
      },
      items: { some: { service: { type: "DRY" } } },
    },
    select: {
      id: true,
      customerId: true,
      machineUsages: {
        where: { cycleType: "DRY" },
        select: { startedAt: true },
      },
      items: {
        where: { service: { type: "DRY" } },
        select: {
          quantity: true,
          service: { select: { name: true } },
        },
      },
    },
  });

  const report = cylinders.map((cylinder) => {
    const end = cylinder.emptiedAt?.getTime() ?? Date.now();
    const customerIds = new Set<string>();
    let dryOrdersCount = 0;
    let normalDryEquivalents = 0;

    for (const order of dryOrders) {
      const usageAt = order.machineUsages[0]?.startedAt.getTime();
      if (
        usageAt === undefined ||
        usageAt < cylinder.filledAt.getTime() ||
        usageAt >= end
      ) continue;

      dryOrdersCount += 1;
      customerIds.add(order.customerId ?? order.id);
      for (const item of order.items) {
        const weight = item.service?.name.toLowerCase().includes("extra dry") ? 0.25 : 1;
        normalDryEquivalents += item.quantity * weight;
      }
    }

    return {
      id: cylinder.id,
      note: cylinder.note,
      filledAt: cylinder.filledAt.toISOString(),
      emptiedAt: cylinder.emptiedAt?.toISOString() ?? null,
      dryOrders: dryOrdersCount,
      dryCustomers: customerIds.size,
      normalDryEquivalents,
    };
  });

  return { cylinders: report, timeZone: tenant.timeZone };
}

export async function startLpgCylinderAction(
  _previousState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
    if (!tenantSlug) throw new Error("Tenant is required.");
    const note = String(formData.get("note") ?? "").trim();
    if (note.length > 500) throw new Error("Note must be 500 characters or fewer.");
    const tenant = await getAdminTenantContext(tenantSlug);
    await db.$transaction(
      async (tx) => {
        const activeCylinder = await tx.lpgCylinder.findFirst({
          where: { tenantId: tenant.id, emptiedAt: null },
          select: { id: true },
        });
        if (activeCylinder) {
          throw new Error("Mark the current LPG cylinder empty before starting another.");
        }

        await tx.lpgCylinder.create({
          data: { tenantId: tenant.id, note: note || null },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath(`/tenants/${tenant.clerkOrgSlug}/tenantDashboard/lpg`);
    return {
      message: JSON.stringify([
        { message: "Full 50 kg LPG cylinder recorded.", result: "success" },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error starting LPG cylinder:", error);
    return renderError(error);
  }
}

export async function markLpgCylinderEmptyAction(
  _previousState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
    if (!tenantSlug) throw new Error("Tenant is required.");
    const tenant = await getAdminTenantContext(tenantSlug);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("LPG cylinder record is required.");

    const result = await db.lpgCylinder.updateMany({
      where: { id, tenantId: tenant.id, emptiedAt: null },
      data: { emptiedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new Error("The active LPG cylinder could not be found.");
    }

    revalidatePath(`/tenants/${tenant.clerkOrgSlug}/tenantDashboard/lpg`);
    return {
      message: JSON.stringify([
        { message: "LPG cylinder marked empty.", result: "success" },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error marking LPG cylinder empty:", error);
    return renderError(error);
  }
}
