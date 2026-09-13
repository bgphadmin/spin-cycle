"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";
import { addServiceSchema } from "@/utils/validation/serviceSchema";

async function getTenantId() {
  const { userId } = await auth();
  const { orgId } = await getServerAuthClaims();

  if (!userId) throw new Error("You must be signed in.");
  if (!orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true },
  });

  if (!tenant) throw new Error("Tenant not found for this organization.");
  return tenant.id;
}

export async function getServicesAction() {
  try {
    const tenantId = await getTenantId();
    const services = await db.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return { services };
  } catch (error: unknown) {
    console.error("Error fetching services:", error);
    return { services: [] };
  }
}

export async function getServiceByIdAction(id: string) {
  try {
    const tenantId = await getTenantId();
    return await db.service.findFirst({ where: { id, tenantId } });
  } catch (error: unknown) {
    console.error("Error fetching service:", error);
    return null;
  }
}

export async function updateServiceAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { orgRole } = await getServerAuthClaims();
    if (orgRole !== "org:admin") throw new Error("This transaction is not allowed at your level.");

    const tenantId = await getTenantId();
    const id = String(formData.get("id") ?? "");
    const fields = addServiceSchema.parse(Object.fromEntries(formData));

    const service = await db.service.update({
      where: { id, tenantId },
      data: {
        name: fields.name,
        price: fields.price,
        duration: fields.duration === "" ? null : fields.duration,
      },
    });

    return {
      message: JSON.stringify([
        { message: "Service updated successfully.", result: "success" },
        { service },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error updating service:", error);
    return renderError(error);
  }
}

export async function deleteServiceAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { orgRole } = await getServerAuthClaims();
    if (orgRole !== "org:admin") throw new Error("This transaction is not allowed at your level.");

    const tenantId = await getTenantId();
    const id = String(formData.get("id") ?? "");
    await db.service.delete({ where: { id, tenantId } });

    return { message: "Service deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting service:", error);
    return { message: "Failed to delete service" };
  }
}
