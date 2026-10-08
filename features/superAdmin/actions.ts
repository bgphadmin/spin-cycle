"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import db from "@/utils/db";
import { requireSuperAdmin } from "./server";

const MAX_MACHINE_MONTHLY_RATE = "99999999.99";

export async function updateMachineMonthlyRateAction(rateValue: string): Promise<number> {
  await requireSuperAdmin();

  const normalizedRate = rateValue.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedRate)) {
    throw new Error("Enter a non-negative rate with no more than two decimal places.");
  }
  if (new Prisma.Decimal(normalizedRate).greaterThan(MAX_MACHINE_MONTHLY_RATE)) {
    throw new Error("The rate cannot exceed ₱99,999,999.99 per machine.");
  }

  const setting = await db.systemSetting.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      machineMonthlyRate: new Prisma.Decimal(normalizedRate),
    },
    update: {
      machineMonthlyRate: new Prisma.Decimal(normalizedRate),
    },
    select: { machineMonthlyRate: true },
  });

  revalidatePath("/super-admin");
  return setting.machineMonthlyRate.toNumber();
}

export async function updateTenantMachineMonthlyRateAction(
  tenantId: string,
  rateValue: string,
): Promise<number | null> {
  await requireSuperAdmin();

  const normalizedRate = rateValue.trim();
  let machineMonthlyRate: Prisma.Decimal | null = null;
  if (normalizedRate) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedRate)) {
      throw new Error("Enter a non-negative rate with no more than two decimal places.");
    }
    machineMonthlyRate = new Prisma.Decimal(normalizedRate);
    if (machineMonthlyRate.greaterThan(MAX_MACHINE_MONTHLY_RATE)) {
      throw new Error("The rate cannot exceed ₱99,999,999.99 per machine.");
    }
  }

  const tenant = await db.tenant.update({
    where: { id: tenantId },
    data: { machineMonthlyRate },
    select: { machineMonthlyRate: true },
  });

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/tenants");
  return tenant.machineMonthlyRate?.toNumber() ?? null;
}
