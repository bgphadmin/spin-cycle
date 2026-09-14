"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { MachineStatus, MachineType } from "@prisma/client";
import db from "@/utils/db";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";

const paymentMethods = ["cash", "card", "gcash"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

export async function createOrderAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { userId } = await auth();
    const { orgId, orgSlug } = await getServerAuthClaims();
    const machineId = String(formData.get("machineId") ?? "");
    const baseServiceId = String(formData.get("baseServiceId") ?? "");
    const customerName = String(formData.get("customerName") ?? "").trim();
    const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod;
    const extraServiceIds = formData.getAll("extraServices").map(String);

    if (!userId || !orgId) throw new Error("You must be signed in to create an order.");
    if (!machineId) throw new Error("Machine is required.");
    if (!baseServiceId) throw new Error("A base service is required.");
    if (!customerName) throw new Error("Customer name is required.");
    if (!paymentMethods.includes(paymentMethod)) {
      throw new Error("A valid payment method is required.");
    }

    const inventoryQuantities = new Map<string, number>();
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("inventory_")) continue;
      const quantity = Number(value);
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Inventory quantities must be whole numbers.");
      }
      if (quantity > 0) inventoryQuantities.set(key.replace("inventory_", ""), quantity);
    }

    const order = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { id: true },
      });
      if (!tenant) throw new Error("Tenant not found for this organization.");

      const machine = await tx.machine.findFirst({
        where: { id: machineId, tenantId: tenant.id },
        select: { id: true, type: true, status: true },
      });
      if (!machine) throw new Error("Machine not found.");
      if (machine.status !== MachineStatus.AVAILABLE) {
        throw new Error("This machine is not currently available.");
      }

      const baseService = await tx.service.findFirst({
        where: { id: baseServiceId, tenantId: tenant.id },
      });
      if (!baseService) throw new Error("Base service not found.");

      const expectedType = machine.type === MachineType.washer ? "WASH" : "DRY";
      if (baseService.type !== expectedType) {
        throw new Error("The selected service does not match this machine.");
      }

      const extraServices = await tx.service.findMany({
        where: {
          id: { in: extraServiceIds.filter((id) => id !== baseService.id) },
          tenantId: tenant.id,
        },
      });
      if (extraServices.length !== new Set(extraServiceIds.filter((id) => id !== baseService.id)).size) {
        throw new Error("One or more selected services are invalid.");
      }

      const inventoryItems = await tx.inventoryItem.findMany({
        where: { id: { in: [...inventoryQuantities.keys()] }, tenantId: tenant.id },
      });
      if (inventoryItems.length !== inventoryQuantities.size) {
        throw new Error("One or more selected inventory items are invalid.");
      }

      for (const item of inventoryItems) {
        const quantity = inventoryQuantities.get(item.id) ?? 0;
        if (item.stock < quantity) {
          throw new Error(`Not enough stock for ${item.name}.`);
        }
      }

      let customer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, name: customerName },
      });
      if (!customer) {
        customer = await tx.customer.create({
          data: { tenantId: tenant.id, name: customerName },
        });
      }

      const serviceItems = [
        {
          service: { connect: { id: baseService.id } },
          price: baseService.price,
          quantity: 1,
        },
        ...extraServices.map((service) => ({
          service: { connect: { id: service.id } },
          price: service.price,
          quantity: 1,
        })),
      ];
      const inventoryOrderItems = inventoryItems.map((item) => ({
        inventoryItem: { connect: { id: item.id } },
        price: item.price,
        quantity: inventoryQuantities.get(item.id) ?? 0,
      }));
      const total =
        serviceItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        inventoryOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const createdOrder = await tx.laundryOrder.create({
        data: {
          tenantId: tenant.id,
          userId,
          customerId: customer.id,
          status: "IN_PROGRESS",
          paymentMethod,
          total,
          items: { create: [...serviceItems, ...inventoryOrderItems] },
          machineUsages: {
            create: {
              machineId: machine.id,
              tenantId: tenant.id,
              cycleType: baseService.type,
              duration: baseService.duration ?? (machine.type === MachineType.washer ? 30 : 45),
              fee: baseService.price,
            },
          },
          payments: {
            create: { amount: total, method: paymentMethod },
          },
        },
      });

      await tx.machine.update({
        where: { id: machine.id },
        data: { status: MachineStatus.IN_USE, usageCount: { increment: 1 } },
      });

      for (const item of inventoryItems) {
        const quantity = inventoryQuantities.get(item.id) ?? 0;
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { stock: { decrement: quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.id,
            tenantId: tenant.id,
            type: "sale",
            quantity,
            unitPrice: item.price,
          },
        });
      }

      return createdOrder;
    });

    revalidatePath(`/tenants/${orgSlug}/tenantDashboard`);
    return {
      message: JSON.stringify([
        { message: "Laundry order created successfully.", result: "success" },
        { orderId: order.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    return renderError(error);
  }
}
