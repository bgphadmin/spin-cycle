"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { businessDayRangeFromKey, getBusinessDayRange } from "@/utils/businessDate";

export type SalesLine = {
  id: number;
  name: string;
  kind: "Service" | "Item";
  quantity: number;
  price: number;
  total: number;
};

export type SalesMachineGroup = {
  machineName: string;
  lines: SalesLine[];
};

export type CustomerSalesCard = {
  customerId: string;
  customerName: string;
  orderIds: string[];
  isPaid: boolean;
  paymentMethods: string[];
  orderTypes: string[];
  handledByNames: string[];
  total: number;
  machineGroups: SalesMachineGroup[];
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

export async function getTodaySalesAction(dateKey?: string): Promise<CustomerSalesCard[]> {
  const tenant = await getTenantId();
  const { start: startOfDay, end: endOfDay } = dateKey
    ? businessDayRangeFromKey(dateKey, tenant.timeZone)
    : getBusinessDayRange(new Date(), tenant.timeZone);

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: startOfDay, lt: endOfDay },
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      customer: { select: { id: true, name: true } },
      payments: { select: { method: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          service: { select: { name: true } },
          inventoryItem: { select: { name: true } },
        },
      },
      machineUsages: {
        select: { machine: { select: { name: true } } },
      },
    },
  });

  const grouped = new Map<string, CustomerSalesCard>();

  const staffUsers = await db.user.findMany({
    where: { tenantId: tenant.id, clerkId: { in: [...new Set(orders.map((order) => order.userId))] } },
    select: { clerkId: true, name: true },
  });
  const staffNameByClerkId = new Map(staffUsers.map((user) => [user.clerkId, user.name]));

  for (const order of orders) {
    const customerId = order.customer?.id ?? `walk-in-${order.id}`;
    const customerName = order.customer?.name ?? "Walk-in";
    const paymentMethod = order.paymentMethod ?? order.payments[0]?.method ?? "UNPAID";
    const orderType = order.orderType.replace("_", "-");
    const machineName = order.machineUsages.map((usage) => usage.machine.name).join(", ") || "Unassigned";
    const handledByName = staffNameByClerkId.get(order.userId) ?? "Unknown";
    const card = grouped.get(customerId) ?? {
      customerId,
      customerName,
      orderIds: [],
      isPaid: true,
      paymentMethods: [],
      orderTypes: [],
      handledByNames: [],
      total: 0,
      machineGroups: [],
    };

    card.orderIds.push(order.id);
    card.isPaid = card.isPaid && order.paid;
    if (!card.paymentMethods.includes(paymentMethod)) card.paymentMethods.push(paymentMethod);
    if (!card.orderTypes.includes(orderType)) card.orderTypes.push(orderType);
    if (!card.handledByNames.includes(handledByName)) card.handledByNames.push(handledByName);
    card.total += order.total;

    let machineGroup = card.machineGroups.find((group) => group.machineName === machineName);
    if (!machineGroup) {
      machineGroup = { machineName, lines: [] };
      card.machineGroups.push(machineGroup);
    }

    for (const item of order.items) {
      const name = item.service?.name ?? item.inventoryItem?.name ?? "Order item";
      machineGroup.lines.push({
        id: item.id,
        name,
        kind: item.service ? "Service" : "Item",
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      });
    }

    grouped.set(customerId, card);
  }

  return [...grouped.values()];
}
