"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { businessDateKey, businessDayRangeFromKey, getBusinessDayRange } from "@/utils/businessDate";

export type SalesSummaryLine = {
  name: string;
  kind: "Service" | "Item";
  quantity: number;
  total: number;
};

export type UnpaidSalesRow = {
  id: string;
  customerName: string;
  orderDate: string;
  total: number;
  lines: SalesSummaryLine[];
};

export type SalesSummary = {
  total: number;
  lines: SalesSummaryLine[];
  unpaid: UnpaidSalesRow[];
};

async function getTenantId() {
  const { userId } = await auth();
  const { orgId } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return tenant;
}

function addLine(
  lines: SalesSummaryLine[],
  item: { service: { name: string } | null; inventoryItem: { name: string } | null; quantity: number; price: number },
) {
  const name = item.service?.name ?? item.inventoryItem?.name ?? "Order item";
  const kind = item.service ? "Service" : "Item";
  const existing = lines.find((line) => line.name === name && line.kind === kind);
  if (existing) {
    existing.quantity += item.quantity;
    existing.total += item.price * item.quantity;
  } else {
    lines.push({ name, kind, quantity: item.quantity, total: item.price * item.quantity });
  }
}

export async function getSalesSummaryAction(dateKey?: string): Promise<SalesSummary> {
  const tenant = await getTenantId();
  const { start: startOfDay, end: endOfDay } = dateKey
    ? businessDayRangeFromKey(dateKey, tenant.timeZone)
    : getBusinessDayRange(new Date(), tenant.timeZone);

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
      OR: [
        { paid: true, createdAt: { gte: startOfDay, lt: endOfDay } },
        { paid: false },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      total: true,
      paid: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          price: true,
          service: { select: { name: true } },
          inventoryItem: { select: { name: true } },
        },
      },
    },
  });

  const lines: SalesSummaryLine[] = [];
  const unpaidGroups = new Map<string, UnpaidSalesRow>();
  let total = 0;

  for (const order of orders) {
    if (order.paid && order.createdAt >= startOfDay && order.createdAt < endOfDay) {
      total += order.total;
      for (const item of order.items) addLine(lines, item);
    }

    if (!order.paid) {
      const orderDate = businessDateKey(order.createdAt, tenant.timeZone);
      const customerName = order.customer?.name ?? "Walk-in";
      const id = `${customerName}:${orderDate}`;
      const row = unpaidGroups.get(id) ?? {
        id,
        customerName,
        orderDate,
        total: 0,
        lines: [],
      };
      row.total += order.total;
      for (const item of order.items) addLine(row.lines, item);
      unpaidGroups.set(id, row);
    }
  }

  return { total, lines, unpaid: [...unpaidGroups.values()] };
}
