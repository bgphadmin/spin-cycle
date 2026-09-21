"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { businessDayRangeFromKey, businessDateKey, getBusinessMonthStart } from "@/utils/businessDate";
import { addExpenseSchema } from "@/utils/validation/expenseSchema";
import type { ExpenseDetail, ExpenseRow } from "@/features/expenses/types/expenseTypes";
import { CUSTOM_CATEGORY_VALUE } from "@/features/expenses/types/expenseTypes";

async function getTenantContext() {
  const { userId } = await auth();
  const { orgId, orgSlug } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return { ...tenant, userId, orgSlug };
}

// Resolves the internal User record (and admin flag) for the signed-in staff
// member. Used to scope non-admin staff to only their own expense records.
async function getCurrentUser(tenant: { id: string; userId: string }) {
  const { orgRole } = await getServerAuthClaims();
  const user = await db.user.findFirst({
    where: { clerkId: tenant.userId, tenantId: tenant.id },
    select: { id: true },
  });
  if (!user) throw new Error("Your staff profile was not found for this shop.");
  return { id: user.id, isAdmin: orgRole === "org:admin" };
}

// Resolves the final category text: either a preset value or the free-text
// "customCategory" field when the user picked the CUSTOM sentinel option.
function resolveCategory(formData: FormData): string {
  const rawCategory = String(formData.get("category") ?? "").trim();
  if (rawCategory === CUSTOM_CATEGORY_VALUE) {
    return String(formData.get("customCategory") ?? "").trim();
  }
  return rawCategory;
}

export async function getExpensesAction({
  startDate,
  endDate,
}: { startDate?: string; endDate?: string } = {}): Promise<{ expenses: ExpenseRow[] }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const now = new Date();
    const startKey = startDate || businessDateKey(getBusinessMonthStart(now, tenant.timeZone), tenant.timeZone);
    const endKey = endDate || businessDateKey(now, tenant.timeZone);

    const { start } = businessDayRangeFromKey(startKey, tenant.timeZone);
    const { end } = businessDayRangeFromKey(endKey, tenant.timeZone);

    const expenses = await db.expense.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: start, lt: end },
        // Staff only ever see expenses they personally recorded; admins see everyone's.
        ...(currentUser.isAdmin ? {} : { userId: currentUser.id }),
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    return {
      expenses: expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        notes: expense.notes,
        createdAt: expense.createdAt.toISOString(),
        userName: expense.user?.name ?? "Unknown",
      })),
    };
  } catch (error: unknown) {
    console.error("Error fetching expenses:", error);
    return { expenses: [] };
  }
}

export async function getExpenseByIdAction(id: string): Promise<ExpenseDetail | null> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const expense = await db.expense.findUnique({
      where: { id, tenantId: tenant.id },
      select: { id: true, category: true, amount: true, notes: true, userId: true },
    });
    if (!expense) return null;
    // Staff can only look up their own expense records.
    if (!currentUser.isAdmin && expense.userId !== currentUser.id) return null;
    return expense;
  } catch (error: unknown) {
    console.error("Error fetching expense:", error);
    return null;
  }
}

export async function addExpenseAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const fields = addExpenseSchema.parse({
      category: resolveCategory(formData),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });
    const expenseDate = String(formData.get("expenseDate") ?? "").trim();
    let createdAt: Date | undefined;
    if (expenseDate) {
      if (!currentUser.isAdmin) throw new Error("Only admins can set an expense date.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) throw new Error("Expense date must be valid.");
      const [year, month, day] = expenseDate.split("-").map(Number);
      const parsedDate = new Date(Date.UTC(year, month - 1, day));
      if (
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
      ) {
        throw new Error("Expense date must be valid.");
      }
      createdAt = businessDayRangeFromKey(expenseDate, tenant.timeZone).start;
    }

    const expense = await db.expense.create({
      data: {
        tenantId: tenant.id,
        userId: currentUser.id,
        category: fields.category,
        amount: fields.amount,
        notes: fields.notes === "" ? null : fields.notes,
        ...(createdAt ? { createdAt } : {}),
      },
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/expense`);
    return {
      message: JSON.stringify([
        { message: "Expense added successfully.", result: "success" },
        { expenseId: expense.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding expense:", error);
    return renderError(error);
  }
}

export async function updateExpenseAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Expense id is required.");

    const existing = await db.expense.findUnique({
      where: { id, tenantId: tenant.id },
      select: { userId: true },
    });
    if (!existing) throw new Error("Expense not found.");
    if (!currentUser.isAdmin && existing.userId !== currentUser.id) {
      throw new Error("You can only edit expenses you added yourself.");
    }

    const fields = addExpenseSchema.parse({
      category: resolveCategory(formData),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });

    const expense = await db.expense.update({
      where: { id, tenantId: tenant.id },
      data: {
        category: fields.category,
        amount: fields.amount,
        notes: fields.notes === "" ? null : fields.notes,
      },
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/expense`);
    return {
      message: JSON.stringify([
        { message: "Expense updated successfully.", result: "success" },
        { expenseId: expense.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error updating expense:", error);
    return renderError(error);
  }
}

export async function deleteExpenseAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const currentUser = await getCurrentUser(tenant);
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Expense id is required.");

    const existing = await db.expense.findUnique({
      where: { id, tenantId: tenant.id },
      select: { userId: true },
    });
    if (!existing) throw new Error("Expense not found.");
    if (!currentUser.isAdmin && existing.userId !== currentUser.id) {
      throw new Error("You can only delete expenses you added yourself.");
    }

    await db.expense.delete({ where: { id, tenantId: tenant.id } });

    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/expense`);
    return { message: "Expense deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting expense:", error);
    return { message: "Failed to delete expense" };
  }
}
