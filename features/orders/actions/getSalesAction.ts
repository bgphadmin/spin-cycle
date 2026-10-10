"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { businessDayRangeFromKey, getBusinessDayRange } from "@/utils/businessDate";
import { getReceiptNumberBase } from "@/features/orders/utils/receiptNumber";

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
  receiptNumber: string;
  isPaid: boolean;
  paymentMethods: string[];
  orderTypes: string[];
  handledByNames: string[];
  discountAmount: number;
  discountNote: string;
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
          service: { select: { name: true, type: true } },
          inventoryItem: { select: { name: true } },
        },
      },
      machineUsages: {
        select: { machine: { select: { name: true } } },
      },
      receiptOrders: {
        select: { receipt: { select: { number: true } } },
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
    const linkedReceiptNumber = order.receiptOrders[0]?.receipt.number;
    const displayReceiptNumber = linkedReceiptNumber
      ? getReceiptNumberBase(linkedReceiptNumber)
      : undefined;
    const receiptNumber = linkedReceiptNumber ?? `UNASSIGNED-${order.id.slice(0, 8)}`;
    const paymentMethod = order.paymentMethod ?? order.payments[0]?.method ?? "UNPAID";
    const orderType = order.orderType.replace("_", "-");
    const machineName = order.machineUsages.map((usage) => usage.machine.name).join(", ") ||
      (order.items.some((item) => item.service?.type === "OTHERS") ? "Other Services" : "Unassigned");
    const handledByName = staffNameByClerkId.get(order.userId) ?? "Unknown";
    const card = grouped.get(customerId) ?? {
      customerId,
      customerName,
      orderIds: [],
      receiptNumber: displayReceiptNumber ?? receiptNumber,
      isPaid: true,
      paymentMethods: [],
      orderTypes: [],
      handledByNames: [],
      discountAmount: 0,
      discountNote: "",
      total: 0,
      machineGroups: [],
    };

    card.orderIds.push(order.id);
    if (displayReceiptNumber && card.receiptNumber.startsWith("UNASSIGNED-")) {
      card.receiptNumber = displayReceiptNumber;
    }
    card.isPaid = card.isPaid && order.paid;
    if (!card.paymentMethods.includes(paymentMethod)) card.paymentMethods.push(paymentMethod);
    if (!card.orderTypes.includes(orderType)) card.orderTypes.push(orderType);
    if (!card.handledByNames.includes(handledByName)) card.handledByNames.push(handledByName);
    card.total += order.total;
    card.discountAmount += order.discountAmount;
    if (order.discountNote && !card.discountNote.includes(order.discountNote)) {
      card.discountNote = card.discountNote
        ? `${card.discountNote}, ${order.discountNote}`
        : order.discountNote;
    }

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
