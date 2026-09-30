"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { expenseCategoryLabel } from "@/features/expenses/types/expenseTypes";
import {
  businessDateKey,
  businessDateKeyToUtcDate,
  businessDateLabel,
  businessDayRangeFromKey,
  getBusinessDayRange,
  getBusinessMonthStart,
  getBusinessYearStart,
} from "@/utils/businessDate";

type DailyPoint = {
  date: string;
  label: string;
  total: number;
};

export type WeekdayAverageSalesPoint = {
  day: string;
  average: number;
};

export type DailyFinancialPoint = {
  date: string;
  label: string;
  sales: number;
  expense: number;
  profit: number;
};

export type AnalyticsSeries = {
  name: string;
  data: DailyPoint[];
};

export type AdminSalesAnalytics = {
  dailySales: DailyPoint[];
  dailyFinancials: DailyFinancialPoint[];
  monthToDate: {
    sales: number;
    expense: number;
    profit: number;
  };
  monthToDateRange: {
    start: string;
    end: string;
  };
  serviceSeries: AnalyticsSeries[];
  inventorySeries: AnalyticsSeries[];
  categoryTotals: Array<{ name: string; total: number }>;
  expenseCategoryTotals: Array<{ name: string; total: number }>;
  categoryStartDate: string;
  categoryEndDate: string;
  topCustomers: Array<{ name: string; total: number }>;
  weekdayAverageSales: WeekdayAverageSalesPoint[];
  weekdayStartDate: string;
  weekdayEndDate: string;
};

export type CategoryAnalytics = Pick<
  AdminSalesAnalytics,
  "categoryTotals" | "expenseCategoryTotals" | "categoryStartDate" | "categoryEndDate"
>;

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

function dateKey(date: Date, timeZone: string) {
  return businessDateKey(date, timeZone);
}

function createDateRange(start: Date, end: Date, timeZone: string) {
  const dates: DailyPoint[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push({
      date: dateKey(cursor, timeZone),
      label: businessDateLabel(cursor, timeZone),
      total: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function calculateWeekdayAverageSales(dailyPoints: DailyPoint[]): WeekdayAverageSalesPoint[] {
  const weekdays = [
    { day: "Monday", weekday: 1, total: 0, days: 0 },
    { day: "Tuesday", weekday: 2, total: 0, days: 0 },
    { day: "Wednesday", weekday: 3, total: 0, days: 0 },
    { day: "Thursday", weekday: 4, total: 0, days: 0 },
    { day: "Friday", weekday: 5, total: 0, days: 0 },
    { day: "Saturday", weekday: 6, total: 0, days: 0 },
    { day: "Sunday", weekday: 0, total: 0, days: 0 },
  ];
  for (const point of dailyPoints) {
    const weekday = new Date(`${point.date}T00:00:00.000Z`).getUTCDay();
    const aggregate = weekdays.find((item) => item.weekday === weekday);
    if (aggregate) {
      aggregate.total += point.total;
      aggregate.days += 1;
    }
  }
  return weekdays
    .map(({ day, total, days }) => ({ day, average: days === 0 ? 0 : total / days }))
    .sort((a, b) => b.average - a.average);
}

export async function getAdminSalesAnalyticsAction(): Promise<AdminSalesAnalytics> {
  const tenant = await getTenantId();
  const { start: today, end: tomorrow } = getBusinessDayRange(new Date(), tenant.timeZone);
  const startOfYear = getBusinessYearStart(new Date(), tenant.timeZone);

  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
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
  const expenses = await db.expense.findMany({
    where: {
      tenantId: tenant.id,
      expenseDate: {
        gte: businessDateKeyToUtcDate(businessDateKey(startOfYear, tenant.timeZone)),
        lte: businessDateKeyToUtcDate(businessDateKey(today, tenant.timeZone)),
      },
    },
    select: {
      amount: true,
      category: true,
      expenseDate: true,
    },
  });

  const dailySales = createDateRange(startOfYear, today, tenant.timeZone);
  const dailySalesByDate = new Map(dailySales.map((point) => [point.date, point]));
  const dailyExpensesByDate = new Map<string, number>();
  const serviceByName = new Map<string, Map<string, number>>();
  const inventoryByName = new Map<string, Map<string, number>>();
  const expenseCategoryTotals = new Map<string, number>();
  const categoryTotals = new Map([
    ["Base Services", 0],
    ["Additional Services", 0],
    ["Inventory Items", 0],
  ]);
  const customerTotals = new Map<string, number>();

  for (const order of orders) {
    const orderDate = dateKey(order.createdAt, tenant.timeZone);
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
        const category =
          item.service.type === "OTHERS" || item.service.type === "FOLDS"
            ? "Additional Services"
            : "Base Services";
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + itemTotal);
      } else if (item.inventoryItem) {
        const inventoryDates = inventoryByName.get(item.inventoryItem.name) ?? new Map<string, number>();
        inventoryDates.set(orderDate, (inventoryDates.get(orderDate) ?? 0) + itemTotal);
        inventoryByName.set(item.inventoryItem.name, inventoryDates);
        categoryTotals.set("Inventory Items", (categoryTotals.get("Inventory Items") ?? 0) + itemTotal);
      }
    }
  }

  for (const expense of expenses) {
    const expenseDate = expense.expenseDate.toISOString().slice(0, 10);
    dailyExpensesByDate.set(expenseDate, (dailyExpensesByDate.get(expenseDate) ?? 0) - Math.abs(expense.amount));
    const category = expenseCategoryLabel(expense.category);
    expenseCategoryTotals.set(category, (expenseCategoryTotals.get(category) ?? 0) + expense.amount);
  }

  const toSeries = (source: Map<string, Map<string, number>>): AnalyticsSeries[] =>
    [...source.entries()].map(([name, values]) => ({
      name,
      data: dailySales.map((point) => ({ ...point, total: values.get(point.date) ?? 0 })),
    }));

  const dailyFinancials = dailySales.map((point) => {
    const expense = dailyExpensesByDate.get(point.date) ?? 0;
    return {
      date: point.date,
      label: point.label,
      sales: point.total,
      expense,
      profit: point.total + expense,
    };
  });
  const weekdayAverageSales = calculateWeekdayAverageSales(dailySales);

  const monthStartKey = businessDateKey(getBusinessMonthStart(new Date(), tenant.timeZone), tenant.timeZone);
  const monthToDate = dailyFinancials
    .filter((point) => point.date >= monthStartKey)
    .reduce(
      (totals, point) => ({
        sales: totals.sales + point.sales,
        expense: totals.expense + point.expense,
        profit: totals.profit + point.profit,
      }),
      { sales: 0, expense: 0, profit: 0 },
    );

  return {
    dailySales,
    dailyFinancials,
    monthToDate: {
      sales: monthToDate.sales,
      expense: Math.abs(monthToDate.expense),
      profit: monthToDate.profit,
    },
    monthToDateRange: {
      start: monthStartKey,
      end: dailyFinancials[dailyFinancials.length - 1]?.date ?? monthStartKey,
    },
    serviceSeries: toSeries(serviceByName),
    inventorySeries: toSeries(inventoryByName),
    categoryTotals: [...categoryTotals.entries()].map(([name, total]) => ({ name, total })),
    expenseCategoryTotals: [...expenseCategoryTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    categoryStartDate: businessDateKey(startOfYear, tenant.timeZone),
    categoryEndDate: businessDateKey(today, tenant.timeZone),
    topCustomers: [...customerTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 25),
    weekdayAverageSales,
    weekdayStartDate: businessDateKey(startOfYear, tenant.timeZone),
    weekdayEndDate: businessDateKey(today, tenant.timeZone),
  };
}

export async function getAdminWeekdayAverageSalesAction(
  startDate: string,
  endDate: string,
): Promise<{
  weekdayAverageSales: WeekdayAverageSalesPoint[];
  weekdayStartDate: string;
  weekdayEndDate: string;
}> {
  const { userId } = await auth();
  const { orgId, orgRole } = await getServerAuthClaims();
  if (!userId || !orgId || orgRole !== "org:admin") {
    throw new Error("Only administrators can view sales analytics.");
  }
  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) {
    throw new Error("Enter a valid date range.");
  }

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found.");

  const { start } = businessDayRangeFromKey(startDate, tenant.timeZone);
  const { end } = businessDayRangeFromKey(endDate, tenant.timeZone);
  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      paid: true,
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
      createdAt: { gte: start, lt: end },
    },
    select: { total: true, createdAt: true },
  });

  const dailySalesByDate = new Map<string, number>();
  for (const order of orders) {
    const orderDate = businessDateKey(order.createdAt, tenant.timeZone);
    dailySalesByDate.set(orderDate, (dailySalesByDate.get(orderDate) ?? 0) + order.total);
  }

  const dailyPoints: DailyPoint[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const lastDay = new Date(`${endDate}T00:00:00.000Z`);
  while (cursor <= lastDay) {
    const date = cursor.toISOString().slice(0, 10);
    dailyPoints.push({ date, label: date, total: dailySalesByDate.get(date) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    weekdayAverageSales: calculateWeekdayAverageSales(dailyPoints),
    weekdayStartDate: startDate,
    weekdayEndDate: endDate,
  };
}

export async function getAdminCategoryAnalyticsAction(
  startDate: string,
  endDate: string,
): Promise<CategoryAnalytics> {
  const { userId } = await auth();
  const { orgId, orgRole } = await getServerAuthClaims();
  if (!userId || !orgId || orgRole !== "org:admin") {
    throw new Error("Only administrators can view sales analytics.");
  }

  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) {
    throw new Error("Enter a valid date range.");
  }

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found.");

  const start = businessDayRangeFromKey(startDate, tenant.timeZone).start;
  const end = businessDayRangeFromKey(endDate, tenant.timeZone).end;
  const [orders, expenses] = await Promise.all([
    db.laundryOrder.findMany({
      where: {
        tenantId: tenant.id,
        paid: true,
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
        createdAt: { gte: start, lt: end },
      },
      select: {
        items: {
          select: {
            quantity: true,
            price: true,
            service: { select: { type: true } },
            inventoryItem: { select: { name: true } },
          },
        },
      },
    }),
    db.expense.findMany({
      where: {
        tenantId: tenant.id,
        expenseDate: {
          gte: businessDateKeyToUtcDate(startDate),
          lte: businessDateKeyToUtcDate(endDate),
        },
      },
      select: { amount: true, category: true },
    }),
  ]);

  const categoryTotals = new Map([
    ["Base Services", 0],
    ["Additional Services", 0],
    ["Inventory Items", 0],
  ]);
  for (const order of orders) {
    for (const item of order.items) {
      const category = item.service
        ? item.service.type === "OTHERS" || item.service.type === "FOLDS"
          ? "Additional Services"
          : "Base Services"
        : item.inventoryItem
          ? "Inventory Items"
          : null;
      if (category) {
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + item.price * item.quantity);
      }
    }
  }

  const expenseCategoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const category = expenseCategoryLabel(expense.category);
    expenseCategoryTotals.set(category, (expenseCategoryTotals.get(category) ?? 0) + expense.amount);
  }

  return {
    categoryTotals: [...categoryTotals.entries()].map(([name, total]) => ({ name, total })),
    expenseCategoryTotals: [...expenseCategoryTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
    categoryStartDate: startDate,
    categoryEndDate: endDate,
  };
}

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}
