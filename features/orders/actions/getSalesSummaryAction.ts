"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

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
  lines: Array<SalesSummaryLine & { orderId: string }>;
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
    select: { id: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return tenant.id;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export async function getSalesSummaryAction(): Promise<SalesSummary> {
  const tenantId = await getTenantId();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId,
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
      const orderDate = localDateKey(order.createdAt);
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
      for (const item of order.items) {
        const name = item.service?.name ?? item.inventoryItem?.name ?? "Order item";
        const kind = item.service ? "Service" : "Item";
        row.lines.push({ orderId: order.id, name, kind, quantity: item.quantity, total: item.price * item.quantity });
      }
      unpaidGroups.set(id, row);
    }
  }

  return { total, lines, unpaid: [...unpaidGroups.values()] };
}
