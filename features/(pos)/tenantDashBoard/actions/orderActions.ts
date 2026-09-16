"use server";

import { MachineStatus, MachineType, PaymentMethod } from "@prisma/client";
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
    const machineId = String(formData.get("machineId") ?? "");
    const baseServiceId = String(formData.get("baseServiceId") ?? "");
    const customerName = String(formData.get("customerName") ?? "").trim();
    const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod;
    const extraServiceIds = formData.getAll("extraServices").map(String);
    const inventoryQuantities = new Map<string, number>();
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("inventory_")) continue;
      const quantity = Number(value);
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Inventory quantities must be whole numbers.");
      }
      if (quantity > 0) inventoryQuantities.set(key.replace("inventory_", ""), quantity);
    }
    if (!orderId || !machineId || !baseServiceId || !customerName || !["CASH", "CARD", "EWALLET"].includes(paymentMethod)) {
      throw new Error("Order, machine, service, customer, and payment method are required.");
    }
    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({
        where: { id: orderId, tenantId: id, status: "IN_PROGRESS" },
        include: { items: true, payments: true },
      });
      if (!order) throw new Error("Active order not found.");
      const machine = await tx.machine.findFirst({
        where: { id: machineId, tenantId: id },
        select: { type: true },
      });
      if (!machine) throw new Error("Machine not found.");

      const baseService = await tx.service.findFirst({ where: { id: baseServiceId, tenantId: id } });
      if (!baseService) throw new Error("Base service not found.");
      const expectedType = machine.type === MachineType.washer ? "WASH" : "DRY";
      if (baseService.type !== expectedType) throw new Error("The selected service does not match this machine.");

      const selectedExtraIds = [...new Set(extraServiceIds.filter((serviceId) => serviceId !== baseService.id))];
      const extraServices = await tx.service.findMany({
        where: { id: { in: selectedExtraIds }, tenantId: id, type: "OTHERS" },
      });
      if (extraServices.length !== selectedExtraIds.length) throw new Error("One or more selected services are invalid.");

      const previousInventoryQuantities = new Map(
        order.items
          .filter((item) => item.inventoryItemId)
          .map((item) => [item.inventoryItemId as string, item.quantity])
      );
      const inventoryIds = [...new Set([...previousInventoryQuantities.keys(), ...inventoryQuantities.keys()])];
      const inventoryItems = await tx.inventoryItem.findMany({
        where: { id: { in: inventoryIds }, tenantId: id },
      });
      if (inventoryItems.length !== inventoryIds.length) throw new Error("One or more selected inventory items are invalid.");

      for (const item of inventoryItems) {
        const previousQuantity = previousInventoryQuantities.get(item.id) ?? 0;
        const nextQuantity = inventoryQuantities.get(item.id) ?? 0;
        if (item.stock + previousQuantity < nextQuantity) {
          throw new Error(`Not enough stock for ${item.name}.`);
        }
        const difference = nextQuantity - previousQuantity;
        if (difference !== 0) {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { stock: { decrement: difference } },
          });
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: item.id,
              tenantId: id,
              type: difference > 0 ? "sale" : "return",
              quantity: Math.abs(difference),
              unitPrice: item.price,
            },
          });
        }
      }

      const serviceItems = [
        { service: { connect: { id: baseService.id } }, price: baseService.price, quantity: 1 },
        ...extraServices.map((service) => ({
          service: { connect: { id: service.id } },
          price: service.price,
          quantity: 1,
        })),
      ];
      const inventoryOrderItems = inventoryItems
        .filter((item) => (inventoryQuantities.get(item.id) ?? 0) > 0)
        .map((item) => ({
          inventoryItem: { connect: { id: item.id } },
          price: item.price,
          quantity: inventoryQuantities.get(item.id) as number,
        }));
      const total =
        serviceItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        inventoryOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const customer = await tx.customer.findFirst({ where: { tenantId: id, name: customerName } })
        ?? await tx.customer.create({ data: { tenantId: id, name: customerName } });

      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({
        data: [
          ...serviceItems.map((item) => ({
            orderId: order.id,
            serviceId: item.service.connect.id,
            price: item.price,
            quantity: item.quantity,
          })),
          ...inventoryOrderItems.map((item) => ({
            orderId: order.id,
            inventoryItemId: item.inventoryItem.connect.id,
            price: item.price,
            quantity: item.quantity,
          })),
        ],
      });
      await tx.laundryOrder.update({
        where: { id: order.id },
        data: { customerId: customer.id, paymentMethod, total },
      });
      if (order.payments[0]) {
        await tx.payment.update({ where: { id: order.payments[0].id }, data: { amount: total, method: paymentMethod } });
      } else {
        await tx.payment.create({ data: { orderId: order.id, amount: total, method: paymentMethod } });
      }
    }, { maxWait: 10000, timeout: 15000 });
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
