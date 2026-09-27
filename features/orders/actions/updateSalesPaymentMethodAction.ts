"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

const PAYMENT_METHODS = ["CASH", "CARD", "EWALLET"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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

export async function updateSalesPaymentMethodAction(orderIds: string[], method: string) {
  const tenantId = await getTenantId();
  const uniqueOrderIds = [...new Set(orderIds.filter((id) => id.trim().length > 0))];
  if (uniqueOrderIds.length === 0) throw new Error("At least one order is required.");
  if (!PAYMENT_METHODS.includes(method as PaymentMethod)) throw new Error("Invalid payment method.");

  const paymentMethod = method as PaymentMethod;
  return db.$transaction(async (tx) => {
    const orders = await tx.laundryOrder.findMany({
      where: { id: { in: uniqueOrderIds }, tenantId },
      select: { id: true, total: true, payments: { select: { id: true } } },
    });
    if (orders.length !== uniqueOrderIds.length) {
      throw new Error("One or more orders could not be found.");
    }

    await tx.laundryOrder.updateMany({
      where: { id: { in: uniqueOrderIds }, tenantId },
      data: { paymentMethod },
    });

    await tx.payment.updateMany({
      where: { orderId: { in: uniqueOrderIds } },
      data: { method: paymentMethod },
    });

    const paymentsToCreate = orders
      .filter((order) => order.payments.length === 0)
      .map((order) => ({
        orderId: order.id,
        amount: order.total,
        method: paymentMethod,
      }));
    if (paymentsToCreate.length > 0) {
      await tx.payment.createMany({ data: paymentsToCreate });
    }

    return { method: paymentMethod };
  }, { maxWait: 10000, timeout: 15000 });
}
