"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { MachineStatus, MachineType, PaymentMethod } from "@prisma/client";
import db from "@/utils/db";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";

type AdminTenant = { id: string; orgSlug: string };

async function getAdminTenant(): Promise<AdminTenant> {
  const { userId } = await auth();
  const { orgId, orgRole, orgSlug } = await getServerAuthClaims();
  if (!userId || !orgId || orgRole !== "org:admin") {
    throw new Error("Only administrators can manage orders.");
  }
  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, clerkOrgSlug: true },
  });
  if (!tenant) throw new Error("Tenant not found.");
  return { id: tenant.id, orgSlug: orgSlug ?? tenant.clerkOrgSlug };
}

export type AdminOrderRow = {
  id: string;
  customerName: string;
  receiptNumber: string;
  createdAt: string;
  status: string;
  orderType: string;
  total: number;
  paid: boolean;
  paymentMethod: string;
  comment: string;
};

export type AdminOrderEditData = {
  order: {
    id: string;
    customerName: string;
    orderType: string;
    paymentMethod: string;
    paid: boolean;
    comment: string;
    status: string;
    machineId: string;
    machineName: string;
    baseServiceId: string;
    extraServiceIds: string[];
    inventoryQuantities: Record<string, number>;
  };
  machines: { id: string; name: string; type: string; status: string }[];
  services: { id: string; name: string; price: number; type: string }[];
  inventoryItems: { id: string; name: string; price: number; unit: string; stock: number }[];
  customers: { id: string; name: string }[];
};

export async function getAdminOrderEditDataAction(orderId: string): Promise<AdminOrderEditData | null> {
  try {
    const tenant = await getAdminTenant();
    const [order, machines, services, inventoryItems, customers] = await Promise.all([
      db.laundryOrder.findFirst({
        where: { id: orderId, tenantId: tenant.id },
        include: {
          customer: { select: { name: true } },
          items: {
            select: {
              serviceId: true,
              inventoryItemId: true,
              quantity: true,
              service: { select: { type: true } },
            },
          },
          payments: { select: { method: true }, take: 1 },
          machineUsages: { orderBy: { startedAt: "asc" }, take: 1, include: { machine: { select: { id: true, name: true } } } },
        },
      }),
      db.machine.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true, type: true, status: true }, orderBy: { name: "asc" } }),
      db.service.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true, price: true, type: true }, orderBy: { name: "asc" } }),
      db.inventoryItem.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true, price: true, unit: true, stock: true }, orderBy: { name: "asc" } }),
      db.customer.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    if (!order) return null;
    const machineUsage = order.machineUsages[0];
    const expectedBaseType = machineUsage?.machine
      ? machines.find((machine) => machine.id === machineUsage.machine.id)?.type === "washer"
        ? "WASH"
        : "DRY"
      : undefined;
    const baseItem = order.items.find(
      (item) => item.serviceId && item.service?.type === expectedBaseType,
    ) ?? order.items.find((item) => item.serviceId && item.service?.type !== "OTHERS");
    return {
      order: {
        id: order.id,
        customerName: order.customer?.name ?? "",
        orderType: order.orderType,
        paymentMethod: order.paymentMethod ?? order.payments[0]?.method ?? "",
        paid: order.paid,
        comment: order.comment ?? "",
        status: order.status,
        machineId: machineUsage?.machine.id ?? "",
        machineName: machineUsage?.machine.name ?? "Unassigned",
        baseServiceId: baseItem?.serviceId ?? "",
        extraServiceIds: order.items
          .filter((item) => item.serviceId && item.serviceId !== baseItem?.serviceId && item.service?.type === "OTHERS")
          .map((item) => item.serviceId as string),
        inventoryQuantities: Object.fromEntries(order.items.filter((item) => item.inventoryItemId).map((item) => [item.inventoryItemId, item.quantity])),
      },
      machines,
      services,
      inventoryItems,
      customers,
    };
  } catch (error) {
    console.error("Error fetching admin order edit data:", error);
    return null;
  }
}

export async function getAdminOrdersAction(): Promise<AdminOrderRow[]> {
  try {
    const tenant = await getAdminTenant();
    const orders = await db.laundryOrder.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        receiptOrders: { select: { receipt: { select: { number: true } } } },
        payments: { select: { method: true }, take: 1 },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      customerName: order.customer?.name ?? "Walk-in",
      receiptNumber: order.receiptOrders[0]?.receipt.number ?? `UNASSIGNED-${order.id.slice(0, 8)}`,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      orderType: order.orderType,
      total: order.total,
      paid: order.paid,
      paymentMethod: order.paymentMethod ?? order.payments[0]?.method ?? "",
      comment: order.comment ?? "",
    }));
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return [];
  }
}

export async function updateAdminOrderAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const tenant = await getAdminTenant();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const machineId = String(formData.get("machineId") ?? "").trim();
    const baseServiceId = String(formData.get("baseServiceId") ?? "").trim();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const orderType = String(formData.get("orderType") ?? "");
    const paymentMethod = String(formData.get("paymentMethod") ?? "");
    const comment = String(formData.get("comment") ?? "").trim();
    const paid = formData.get("paid") === "on";
    const extraServiceIds = [...new Set(formData.getAll("extraServices").map(String))];
    const inventoryQuantities = new Map<string, number>();
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("inventory_")) continue;
      const quantity = Number(value);
      if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Inventory quantities must be whole numbers.");
      if (quantity > 0) inventoryQuantities.set(key.slice("inventory_".length), quantity);
    }

    if (!orderId || !machineId || !baseServiceId || !["WALK_IN", "DELIVERY"].includes(orderType)) {
      throw new Error("Order, machine, base service, and order type are required.");
    }
    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      throw new Error("Invalid payment method.");
    }

    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({
        where: { id: orderId, tenantId: tenant.id },
        include: { items: true, payments: { select: { id: true } }, machineUsages: true, receiptOrders: true },
      });
      if (!order) throw new Error("Order not found.");

      const machine = await tx.machine.findFirst({ where: { id: machineId, tenantId: tenant.id } });
      if (!machine) throw new Error("Machine not found.");
      const baseService = await tx.service.findFirst({ where: { id: baseServiceId, tenantId: tenant.id } });
      if (!baseService) throw new Error("Base service not found.");
      const expectedType = machine.type === MachineType.washer ? "WASH" : "DRY";
      if (baseService.type !== expectedType) throw new Error("The selected service does not match this machine.");
      const selectedExtraIds = extraServiceIds.filter((id) => id !== baseServiceId);
      const extraServices = await tx.service.findMany({ where: { id: { in: selectedExtraIds }, tenantId: tenant.id, type: "OTHERS" } });
      if (extraServices.length !== selectedExtraIds.length) throw new Error("One or more selected services are invalid.");
      const previousInventory = new Map(order.items.filter((item) => item.inventoryItemId).map((item) => [item.inventoryItemId as string, item.quantity]));
      const inventoryIds = [...new Set([...previousInventory.keys(), ...inventoryQuantities.keys()])];
      const inventoryItems = await tx.inventoryItem.findMany({ where: { id: { in: inventoryIds }, tenantId: tenant.id } });
      if (inventoryItems.length !== inventoryIds.length) throw new Error("One or more selected inventory items are invalid.");
      for (const item of inventoryItems) {
        const next = inventoryQuantities.get(item.id) ?? 0;
        const previous = previousInventory.get(item.id) ?? 0;
        if (item.stock + previous < next) throw new Error(`Not enough stock for ${item.name}.`);
        const difference = next - previous;
        if (difference) {
          await tx.inventoryItem.update({ where: { id: item.id }, data: { stock: { decrement: difference } } });
          await tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, tenantId: tenant.id, type: difference > 0 ? "sale" : "return", quantity: Math.abs(difference), unitPrice: item.price } });
        }
      }

      let customerId: string | null = null;
      if (customerName) {
        const customer = await tx.customer.upsert({
          where: { tenantId_name: { tenantId: tenant.id, name: customerName } },
          update: {},
          create: { tenantId: tenant.id, name: customerName },
          select: { id: true },
        });
        customerId = customer.id;
      }

      const serviceItems = [
        { serviceId: baseService.id, price: baseService.price, quantity: 1 },
        ...extraServices.map((service) => ({ serviceId: service.id, price: service.price, quantity: 1 })),
      ];
      const inventoryOrderItems = inventoryItems.filter((item) => (inventoryQuantities.get(item.id) ?? 0) > 0).map((item) => ({
        inventoryItemId: item.id, price: item.price, quantity: inventoryQuantities.get(item.id) as number,
      }));
      const total = [...serviceItems, ...inventoryOrderItems].reduce((sum, item) => sum + item.price * item.quantity, 0);

      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: [
        ...serviceItems.map((item) => ({ orderId: order.id, serviceId: item.serviceId, price: item.price, quantity: item.quantity })),
        ...inventoryOrderItems.map((item) => ({ orderId: order.id, inventoryItemId: item.inventoryItemId, price: item.price, quantity: item.quantity })),
      ] });
      await tx.laundryOrder.update({
        where: { id: order.id },
        data: {
          customerId,
          total,
          orderType: orderType as "WALK_IN" | "DELIVERY",
          paymentMethod: (paymentMethod || null) as PaymentMethod | null,
          paid,
          paidAt: paid ? new Date() : null,
          comment: comment || null,
        },
      });

      if (paymentMethod) {
        if (order.payments[0]) {
          await tx.payment.update({
            where: { id: order.payments[0].id },
            data: { amount: total, method: paymentMethod },
          });
        } else {
          await tx.payment.create({
            data: { orderId: order.id, amount: total, method: paymentMethod },
          });
        }
      } else {
        await tx.payment.deleteMany({ where: { orderId: order.id } });
      }

      const usage = order.machineUsages[0];
      if (usage && usage.machineId !== machine.id) {
        if (!usage.endedAt && order.status === "IN_PROGRESS") {
          await tx.machine.update({ where: { id: usage.machineId }, data: { status: MachineStatus.AVAILABLE } });
          if (machine.status !== MachineStatus.AVAILABLE && machine.id !== usage.machineId) throw new Error("The selected machine is not available.");
          await tx.machine.update({ where: { id: machine.id }, data: { status: MachineStatus.IN_USE } });
        }
        await tx.machineUsage.update({ where: { id: usage.id }, data: { machineId: machine.id, cycleType: baseService.type, duration: baseService.duration ?? usage.duration, fee: baseService.price } });
      } else if (usage) {
        await tx.machineUsage.update({ where: { id: usage.id }, data: { cycleType: baseService.type, duration: baseService.duration ?? usage.duration, fee: baseService.price } });
      } else {
        await tx.machineUsage.create({ data: { orderId: order.id, tenantId: tenant.id, machineId: machine.id, cycleType: baseService.type, duration: baseService.duration ?? 30, fee: baseService.price } });
      }
      for (const receiptOrder of order.receiptOrders) {
        await tx.receipt.update({ where: { id: receiptOrder.receiptId }, data: { total: { increment: total - order.total } } });
      }
    }, {
      timeout: 15000,
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/adminDashboard`);
    return { message: JSON.stringify([{ message: "Order updated successfully.", result: "success" }]) };
  } catch (error) {
    return renderError(error);
  }
}

export async function deleteAdminOrderAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const tenant = await getAdminTenant();
    const orderId = String(formData.get("orderId") ?? "").trim();
    if (!orderId) throw new Error("Order id is required.");

    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({
        where: { id: orderId, tenantId: tenant.id },
        include: { items: true, machineUsages: true, receiptOrders: true },
      });
      if (!order) throw new Error("Order not found.");

      if (order.status !== "CANCELLED") {
        for (const item of order.items) {
          if (item.inventoryItemId) {
            await tx.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }
      for (const usage of order.machineUsages) {
        if (!usage.endedAt) {
          await tx.machine.update({
            where: { id: usage.machineId },
            data: { status: MachineStatus.AVAILABLE },
          });
        }
      }
      await tx.receiptOrder.deleteMany({ where: { orderId: order.id } });
      for (const receiptOrder of order.receiptOrders) {
        const receipt = await tx.receipt.findUnique({
          where: { id: receiptOrder.receiptId },
          select: { id: true, total: true },
        });
        if (receipt && receipt.total <= order.total) {
          await tx.receipt.delete({ where: { id: receipt.id } });
        } else if (receipt) {
          await tx.receipt.update({
            where: { id: receipt.id },
            data: { total: { decrement: order.total } },
          });
        }
      }
      await tx.payment.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.machineUsage.deleteMany({ where: { orderId: order.id } });
      await tx.laundryOrder.delete({ where: { id: order.id } });
    }, {
      timeout: 15000,
    });

    revalidatePath(`/tenants/${tenant.orgSlug}/adminDashboard`);
    return { message: JSON.stringify([{ message: "Order deleted successfully.", result: "success" }]) };
  } catch (error) {
    return renderError(error);
  }
}
