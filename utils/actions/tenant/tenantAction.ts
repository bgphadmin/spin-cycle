"use server"

import { Prisma } from "@prisma/client"
import { SortingState } from "@tanstack/react-table"
import db from "@/utils/db"
import { tenantSchema } from "@/utils/validation/tenantSchema"
import { revalidatePath } from "next/cache"
import { renderError } from "@/utils/error"

interface TenantQuery {
  pageIndex: number
  pageSize?: number
  q?: string
  startDate?: string
  endDate?: string
  sort?: SortingState
}

const sortableFields = new Set([
  "shopName",
  "contactPerson",
  "phone",
  "email",
  "subscriptionStatus",
  "createdAt",
])

function parseDate(value: string, label: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label}`)
  }
  return date
}

export async function getTenantsPerPage({
  pageIndex = 0,
  pageSize = 10,
  q,
  startDate,
  endDate,
  sort,
}: TenantQuery) {
  const where: Prisma.TenantWhereInput = {}
  const createdAt: Prisma.DateTimeFilter = {}

  if (startDate) createdAt.gte = parseDate(startDate, "start date")
  if (endDate) {
    const end = parseDate(endDate, "end date")
    end.setHours(23, 59, 59, 999)
    createdAt.lte = end
  }
  if (Object.keys(createdAt).length > 0) where.createdAt = createdAt

  const search = q?.trim()
  if (search) {
    where.OR = [
      { shopName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const requestedSort = sort?.[0]
  const sortField =
    requestedSort && sortableFields.has(requestedSort.id)
      ? requestedSort.id
      : "createdAt"
  const orderBy: Prisma.TenantOrderByWithRelationInput = {
    [sortField]: requestedSort?.desc ? "desc" : "asc",
  }

  const [rows, total] = await Promise.all([
    db.tenant.findMany({
      skip: pageIndex * pageSize,
      take: pageSize,
      where,
      orderBy,
    }),
    db.tenant.count({ where }),
  ])

  const safeRows = rows.map((tenant) => ({
    ...tenant,
    createdAt: tenant.createdAt.toISOString(),
  }))

  return { safeRows, total }
}

export async function editTenantAction(id: string, formData: FormData): Promise<{ message: string }> {
//   const { userId } = auth();
  try {
    const rawData = Object.fromEntries(formData);
    const validatedFields = tenantSchema.parse(rawData);
        const result = await db.$transaction(async (tx) => {
      // Get the existing distribution
      const existing = await tx.tenant.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("Tenant not found");

      // Update tenant
      const updated = await tx.tenant.update({
        where: { id },
        data: {
          shopName: validatedFields.shopName,
          address: validatedFields.address,
          contactPerson: validatedFields.contactPerson,
          contactPosition: validatedFields.contactPosition,
          phone: validatedFields.phone,
          email: validatedFields.email,
          subscriptionStatus: validatedFields.subscriptionStatus,
        },
      });

      return updated;
    });

    revalidatePath("/dashboard/tenants");
    return {
      message: JSON.stringify([
        { message: "Tenant updated successfully" },
        { result: "success" },
        { distribution: result },
      ]),
    };
  } catch (err: unknown) {
    console.error("Update error:", err);
    return renderError(err);
  }
}

export async function deleteTenantItemAction(id: string): Promise<{ message: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.tenant.findUnique({
        where: { id },
      });
      if (!existing) throw new Error("Tenant not found");

      // Delete tenant
      await tx.tenant.delete({ where: { id } });

      return existing;
    });
    revalidatePath("/dashboard/tenants");
    return {
      message: JSON.stringify([
        { message: "Tenant deleted successfully" },
        { result: "success" },
        { distribution: result },
      ])
    };
  } catch (err: unknown) {
      return renderError(err);
  }
}

export async function addTenantAction(
  prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
//   const { userId } = auth();

  try {
    const rawData = Object.fromEntries(formData);
    const validatedFields = tenantSchema.parse(rawData);

    // 🔑 Transaction: create distribution + update rice stock
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          shopName: validatedFields.shopName,
          address: validatedFields.address,
          contactPerson: validatedFields.contactPerson,
          contactPosition: validatedFields.contactPosition,
          phone: validatedFields.phone,
          email: validatedFields.email,
          subscriptionStatus: validatedFields.subscriptionStatus,
        },
      });
      return tenant;
    });

    revalidatePath("/dashboard/tenants");
    return {
      message: JSON.stringify([
        { message: "Tenant added successfully" },
        { result: "success" },
        { tenant: result },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding tenant:", error);
    return renderError(error);
  }
}