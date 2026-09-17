"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

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

export async function toggleSalesPaymentAction(orderIds: string[]) {
  const tenantId = await getTenantId();
  const uniqueOrderIds = [...new Set(orderIds.filter((id) => id.trim().length > 0))];
  if (uniqueOrderIds.length === 0) throw new Error("At least one order is required.");

  return db.$transaction(async (tx) => {
    const orders = await tx.laundryOrder.findMany({
      where: { id: { in: uniqueOrderIds }, tenantId },
      select: { id: true, paid: true },
    });
    if (orders.length !== uniqueOrderIds.length) {
      throw new Error("One or more orders could not be found.");
    }

    const paid = !orders.every((order) => order.paid);
    await tx.laundryOrder.updateMany({
      where: { id: { in: uniqueOrderIds }, tenantId },
      data: { paid, paidAt: paid ? new Date() : null },
    });

    return { paid };
  });
}
