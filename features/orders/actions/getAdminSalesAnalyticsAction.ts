"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { businessDateKey, businessDateLabel, getBusinessDayRange, getBusinessYearStart } from "@/utils/businessDate";

type DailyPoint = {
  date: string;
  label: string;
  total: number;
};

export type AnalyticsSeries = {
  name: string;
  data: DailyPoint[];
};

export type AdminSalesAnalytics = {
  dailySales: DailyPoint[];
  serviceSeries: AnalyticsSeries[];
  inventorySeries: AnalyticsSeries[];
  categoryTotals: Array<{ name: string; total: number }>;
  topCustomers: Array<{ name: string; total: number }>;
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

function dateKey(date: Date) {
  return businessDateKey(date);
}

function createDateRange(start: Date, end: Date) {
  const dates: DailyPoint[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push({
      date: dateKey(cursor),
      label: businessDateLabel(cursor),
      total: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function getAdminSalesAnalyticsAction(): Promise<AdminSalesAnalytics> {
  const tenantId = await getTenantId();
  const { start: today, end: tomorrow } = getBusinessDayRange();
  const startOfYear = getBusinessYearStart();

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId,
      paid: true,
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
      createdAt: { gte: startOfYear, lt: tomorrow },
    },
    select: {
      total: true,
      createdAt: true,
      customer: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          price: true,
          service: { select: { name: true, type: true } },
          inventoryItem: { select: { name: true } },
        },
      },
    },
  });

  const dailySales = createDateRange(startOfYear, today);
  const dailySalesByDate = new Map(dailySales.map((point) => [point.date, point]));
  const serviceByName = new Map<string, Map<string, number>>();
  const inventoryByName = new Map<string, Map<string, number>>();
  const categoryTotals = new Map([
    ["Base Services", 0],
    ["Additional Services", 0],
    ["Inventory Items", 0],
  ]);
  const customerTotals = new Map<string, number>();

  for (const order of orders) {
    const orderDate = dateKey(order.createdAt);
    const dailyPoint = dailySalesByDate.get(orderDate);
    if (dailyPoint) dailyPoint.total += order.total;

    const customerName = order.customer?.name ?? "Walk-in";
    customerTotals.set(customerName, (customerTotals.get(customerName) ?? 0) + order.total);

    for (const item of order.items) {
      const itemTotal = item.price * item.quantity;
      if (item.service) {
        const serviceDates = serviceByName.get(item.service.name) ?? new Map<string, number>();
        serviceDates.set(orderDate, (serviceDates.get(orderDate) ?? 0) + itemTotal);
        serviceByName.set(item.service.name, serviceDates);
        const category = item.service.type === "OTHERS" ? "Additional Services" : "Base Services";
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + itemTotal);
      } else if (item.inventoryItem) {
        const inventoryDates = inventoryByName.get(item.inventoryItem.name) ?? new Map<string, number>();
        inventoryDates.set(orderDate, (inventoryDates.get(orderDate) ?? 0) + itemTotal);
        inventoryByName.set(item.inventoryItem.name, inventoryDates);
        categoryTotals.set("Inventory Items", (categoryTotals.get("Inventory Items") ?? 0) + itemTotal);
      }
    }
  }

  const toSeries = (source: Map<string, Map<string, number>>): AnalyticsSeries[] =>
    [...source.entries()].map(([name, values]) => ({
      name,
      data: dailySales.map((point) => ({ ...point, total: values.get(point.date) ?? 0 })),
    }));

  return {
    dailySales,
    serviceSeries: toSeries(serviceByName),
    inventorySeries: toSeries(inventoryByName),
    categoryTotals: [...categoryTotals.entries()].map(([name, total]) => ({ name, total })),
    topCustomers: [...customerTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 25),
  };
}
