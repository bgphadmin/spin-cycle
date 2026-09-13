"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";
import { inventoryItemSchema } from "@/utils/validation/inventorySchema";

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

export async function addInventoryItemAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { orgRole } = await getServerAuthClaims();
    if (orgRole !== "org:admin") {
      throw new Error("This transaction is not allowed at your level.");
    }

    const tenantId = await getTenantId();
    const fields = inventoryItemSchema.parse(Object.fromEntries(formData));
    const item = await db.inventoryItem.create({ data: { tenantId, ...fields } });

    return {
      message: JSON.stringify([
        { message: "Inventory item added successfully.", result: "success" },
        { inventoryItemId: item.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding inventory item:", error);
    return renderError(error);
  }
}

export async function getInventoryItemsAction() {
  try {
    const tenantId = await getTenantId();
    const inventoryItems = await db.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return { inventoryItems };
  } catch (error: unknown) {
    console.error("Error fetching inventory items:", error);
    return { inventoryItems: [] };
  }
}

export async function getInventoryItemByIdAction(id: string) {
  try {
    const tenantId = await getTenantId();
    return await db.inventoryItem.findFirst({ where: { id, tenantId } });
  } catch (error: unknown) {
    console.error("Error fetching inventory item:", error);
    return null;
  }
}

export async function updateInventoryItemAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { orgRole } = await getServerAuthClaims();
    if (orgRole !== "org:admin") {
      throw new Error("This transaction is not allowed at your level.");
    }

    const tenantId = await getTenantId();
    const id = String(formData.get("id") ?? "");
    const fields = inventoryItemSchema.parse(Object.fromEntries(formData));
    const item = await db.inventoryItem.findFirst({ where: { id, tenantId } });

    if (!item) throw new Error("Inventory item not found.");

    await db.inventoryItem.update({ where: { id: item.id }, data: fields });

    return {
      message: JSON.stringify([
        { message: "Inventory item updated successfully.", result: "success" },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error updating inventory item:", error);
    return renderError(error);
  }
}

export async function deleteInventoryItemAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { orgRole } = await getServerAuthClaims();
    if (orgRole !== "org:admin") {
      throw new Error("This transaction is not allowed at your level.");
    }

    const tenantId = await getTenantId();
    const id = String(formData.get("id") ?? "");
    const item = await db.inventoryItem.findFirst({ where: { id, tenantId } });

    if (!item) throw new Error("Inventory item not found.");

    await db.inventoryItem.delete({ where: { id: item.id } });
    return { message: "Inventory item deleted successfully" };
  } catch (error: unknown) {
    console.error("Error deleting inventory item:", error);
    return { message: "Failed to delete inventory item" };
  }
}
