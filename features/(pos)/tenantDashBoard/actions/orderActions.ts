"use server";

import { MachineStatus } from "@prisma/client";
import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";

async function tenantId() {
  const { userId } = await auth();
  const { orgId } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Authentication is required.");
  const tenant = await db.tenant.findUnique({ where: { clerkOrgId: orgId }, select: { id: true } });
  if (!tenant) throw new Error("Tenant not found.");
  return tenant.id;
}

export async function getActiveOrderAction(machineId: string) {
  try {
    const id = await tenantId();
    return await db.laundryOrder.findFirst({
      where: { tenantId: id, status: "IN_PROGRESS", machineUsages: { some: { machineId, endedAt: null } } },
      include: { customer: true, items: { include: { service: true, inventoryItem: true } } },
    });
  } catch (error) {
    console.error("Error fetching active order:", error);
    return null;
  }
}

export async function completeOrderAction(orderId: string) {
  try {
    const id = await tenantId();
    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({ where: { id: orderId, tenantId: id, status: "IN_PROGRESS" }, include: { machineUsages: true } });
      if (!order) throw new Error("Active order not found.");
      await tx.laundryOrder.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
      for (const usage of order.machineUsages) {
        await tx.machineUsage.update({ where: { id: usage.id }, data: { endedAt: new Date() } });
        await tx.machine.update({ where: { id: usage.machineId }, data: { status: MachineStatus.AVAILABLE } });
      }

    });
    return { message: "Order completed successfully." };
  } catch (error) { return renderError(error); }
}

export async function updateOrderAction(_prevState: unknown, formData: FormData) {
  try {
    const id = await tenantId();
    const orderId = String(formData.get("orderId") ?? "");
    const customerName = String(formData.get("customerName") ?? "").trim();
    const paymentMethod = String(formData.get("paymentMethod") ?? "");
    if (!orderId || !customerName || !["cash", "card", "gcash"].includes(paymentMethod)) {
      throw new Error("Customer and payment method are required.");
    }
    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({ where: { id: orderId, tenantId: id, status: "IN_PROGRESS" } });
      if (!order) throw new Error("Active order not found.");
      const customer = await tx.customer.upsert({
        where: { name: customerName },
        update: {},
        create: { name: customerName, tenantId: id },
      });
      await tx.laundryOrder.update({ where: { id: order.id }, data: { customerId: customer.id, paymentMethod } });
    });
    return { message: JSON.stringify([{ message: "Order updated successfully.", result: "success" }]) };
  } catch (error) { return renderError(error); }
}

export async function cancelOrderAction(orderId: string) {
  try {
    const id = await tenantId();
    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({ where: { id: orderId, tenantId: id, status: "IN_PROGRESS" }, include: { items: true, machineUsages: true } });
      if (!order) throw new Error("Active order not found.");
      for (const item of order.items) if (item.inventoryItemId) {
        await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.laundryOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      for (const usage of order.machineUsages) {
        await tx.machineUsage.update({ where: { id: usage.id }, data: { endedAt: new Date() } });
        await tx.machine.update({ where: { id: usage.machineId }, data: { status: MachineStatus.AVAILABLE } });
      }
    });
    return { message: "Order cancelled successfully." };
  } catch (error) { return renderError(error); }
}
