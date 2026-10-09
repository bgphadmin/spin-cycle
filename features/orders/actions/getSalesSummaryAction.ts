"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import {
  businessDateKey,
  businessDateKeyToUtcDate,
  businessDayRangeFromKey,
  getBusinessDayRange,
} from "@/utils/businessDate";

export type SalesSummaryLine = {
  name: string;
  kind: "Service" | "Item";
  category: string;
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
  expensesTotal: number;
  netProfit: number;
  categoryOptions: string[];
  startDate: string;
  endDate: string;
  lines: SalesSummaryLine[];
  unpaid: UnpaidSalesRow[];
};

export type SalesSummaryUser = {
  id: string;
  name: string;
};

async function getSalesContext() {
  const { userId } = await auth();
  const { orgId, orgRole } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  const currentUser = await db.user.findFirst({
    where: { clerkId: userId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!currentUser) throw new Error("Your staff profile was not found for this shop.");
  return {
    ...tenant,
    userId,
    userRecordId: currentUser.id,
    isAdmin: orgRole === "org:admin",
  };
}

export async function getSalesSummaryUsersAction(): Promise<SalesSummaryUser[]> {
  const tenant = await getSalesContext();
  if (!tenant.isAdmin) return [];

  return db.user.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

function addLine(
  lines: SalesSummaryLine[],
  item: {
    service: { name: string; type: string } | null;
    inventoryItem: { name: string; type: string } | null;
    quantity: number;
    price: number;
  },
  discountFactor = 1,
) {
  const name = item.service?.name ?? item.inventoryItem?.name ?? "Order item";
  const kind = item.service ? "Service" : "Item";
  const category = item.service?.type ?? item.inventoryItem?.type ?? "Other";
  const lineTotal = item.price * item.quantity * discountFactor;
  const existing = lines.find((line) => line.name === name && line.kind === kind && line.category === category);
  if (existing) {
    existing.quantity += item.quantity;
    existing.total += lineTotal;
  } else {
    lines.push({ name, kind, category, quantity: item.quantity, total: lineTotal });
  }
}

export async function getSalesSummaryAction(filters?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<SalesSummary> {
  const tenant = await getSalesContext();
  const today = businessDateKey(new Date(), tenant.timeZone);
  let startDate = today;
  let endDate = today;

  if (tenant.isAdmin && (filters?.startDate || filters?.endDate)) {
    startDate = filters.startDate || filters.endDate || today;
    endDate = filters.endDate || filters.startDate || today;
    if (!isDateKey(startDate) || !isDateKey(endDate)) {
      throw new Error("Enter a valid date range.");
    }
    if (startDate > endDate) [startDate, endDate] = [endDate, startDate];
  }

  const { start: startOfDay } = businessDayRangeFromKey(startDate, tenant.timeZone);
  const { end: endOfDay } = businessDayRangeFromKey(endDate, tenant.timeZone);

  let selectedUsers: { id: string; clerkId: string }[] | null = null;
  const userId = tenant.isAdmin ? filters?.userId?.trim() : "";
  if (userId && userId !== "all") {
    const selectedUser = await db.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
      select: { id: true, clerkId: true },
    });
    selectedUsers = selectedUser ? [selectedUser] : [];
  }

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
      OR: [
        {
          paid: true,
          createdAt: { gte: startOfDay, lt: endOfDay },
          ...(tenant.isAdmin && selectedUsers
            ? { userId: { in: selectedUsers.map((user) => user.clerkId) } }
            : {}),
          ...(!tenant.isAdmin ? { userId: tenant.userId } : {}),
        },
        {
          paid: false,
          ...(tenant.isAdmin
            ? {
                ...(selectedUsers
                  ? { userId: { in: selectedUsers.map((user) => user.clerkId) } }
                  : {}),
              }
            : {}),
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      total: true,
      paid: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          price: true,
          service: { select: { name: true, type: true } },
          inventoryItem: { select: { name: true, type: true } },
        },
      },
    },
  });
  const expenses = await db.expense.aggregate({
    where: {
      tenantId: tenant.id,
      expenseDate: {
        gte: businessDateKeyToUtcDate(startDate),
        lte: businessDateKeyToUtcDate(endDate),
      },
      ...(tenant.isAdmin
        ? selectedUsers
          ? { userId: { in: selectedUsers.map((user) => user.id) } }
          : {}
        : { userId: tenant.userRecordId }),
    },
    _sum: { amount: true },
  });
  const [services, inventoryItems] = await Promise.all([
    db.service.findMany({
      where: { tenantId: tenant.id },
      select: { type: true },
    }),
    db.inventoryItem.findMany({
      where: { tenantId: tenant.id },
      select: { type: true },
    }),
  ]);

  const lines: SalesSummaryLine[] = [];
  const unpaidGroups = new Map<string, UnpaidSalesRow>();
  let total = 0;
  const expensesTotal = expenses._sum.amount ?? 0;

  for (const order of orders) {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountFactor = subtotal > 0 ? order.total / subtotal : 1;
    if (
      order.paid &&
      order.createdAt >= startOfDay &&
      order.createdAt < endOfDay &&
      (tenant.isAdmin
        ? !selectedUsers || selectedUsers.some((user) => user.clerkId === order.userId)
        : order.userId === tenant.userId)
    ) {
      total += order.total;
      for (const item of order.items) addLine(lines, item, discountFactor);
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
      for (const item of order.items) addLine(row.lines, item, discountFactor);
      unpaidGroups.set(id, row);
    }
  }

  return {
    total,
    expensesTotal,
    netProfit: total - expensesTotal,
    categoryOptions: [...new Set([
      ...services.map((service) => service.type),
      ...inventoryItems.map((item) => item.type),
    ])].sort((a, b) => a.localeCompare(b)),
    startDate,
    endDate,
    lines,
    unpaid: [...unpaidGroups.values()],
  };
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
