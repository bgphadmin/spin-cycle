"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { customerSchema } from "@/utils/validation/customerSchema";
import type { CustomerDetail, CustomerRow } from "../types/customerTypes";

async function getTenantContext() {
  const { userId } = await auth();
  const { orgId, orgSlug } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, clerkOrgSlug: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return { ...tenant, orgSlug: orgSlug ?? tenant.clerkOrgSlug };
}

function fieldsFromForm(formData: FormData) {
  const fields = customerSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
  });
  return {
    name: fields.name,
    phone: fields.phone || null,
    email: fields.email || null,
  };
}

export async function getCustomersAction(): Promise<{ customers: CustomerRow[] }> {
  try {
    const tenant = await getTenantContext();
    const customers = await db.customer.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    });
    return {
      customers: customers.map((customer) => ({ ...customer, createdAt: customer.createdAt.toISOString() })),
    };
  } catch (error: unknown) {
    console.error("Error fetching customers:", error);
    return { customers: [] };
  }
}

export async function getCustomerByIdAction(id: string): Promise<CustomerDetail | null> {
  try {
    const tenant = await getTenantContext();
    return db.customer.findUnique({
      where: { id, tenantId: tenant.id },
      select: { id: true, name: true, phone: true, email: true },
    });
  } catch (error: unknown) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export async function addCustomerAction(_prevState: unknown, formData: FormData): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const customer = await db.customer.create({ data: { tenantId: tenant.id, ...fieldsFromForm(formData) } });
    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/customer`);
    return {
      message: JSON.stringify([
        { message: "Customer added successfully.", result: "success" },
        { customerId: customer.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding customer:", error);
    return renderError(error);
  }
}

export async function updateCustomerAction(_prevState: unknown, formData: FormData): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Customer id is required.");
    const customer = await db.customer.update({
      where: { id, tenantId: tenant.id },
      data: fieldsFromForm(formData),
    });
    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/customer`);
    return {
      message: JSON.stringify([
        { message: "Customer updated successfully.", result: "success" },
        { customerId: customer.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error updating customer:", error);
    return renderError(error);
  }
}

export async function deleteCustomerAction(_prevState: unknown, formData: FormData): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Customer id is required.");
    await db.customer.delete({ where: { id, tenantId: tenant.id } });
    revalidatePath(`/tenants/${tenant.orgSlug}/tenantDashboard/customer`);
    return { message: "Customer deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting customer:", error);
    return { message: "Failed to delete customer" };
  }
}
