"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import db from "@/utils/db";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { renderError } from "@/utils/error";
import { businessDateKey, businessDayRangeFromKey } from "@/utils/businessDate";

const PAYMENT_METHODS = ["CASH", "CARD", "EWALLET"] as const;
const ORDER_TYPES = ["WALK_IN", "DELIVERY"] as const;

export type OtherServiceSaleRow = {
  id: string;
  createdAt: string;
  createdAtLabel: string;
  businessDate: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  pricingUnit: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  orderType: "WALK_IN" | "DELIVERY";
  paid: boolean;
  paymentMethod: string;
  comment: string;
};

async function getTenantContext() {
  const { userId } = await auth();
  const { orgId, orgSlug } = await getServerAuthClaims();
  if (!userId || !orgId) throw new Error("Organization context is required.");

  const tenant = await db.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, timeZone: true },
  });
  if (!tenant) throw new Error("Tenant not found for this organization.");
  return { ...tenant, userId, orgId, orgSlug };
}

function validDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

async function addOrderToCustomerReceipt(
  tx: Prisma.TransactionClient,
  tenantId: string,
  customerId: string,
  orderId: string,
  total: number,
  createdAt: Date,
  timeZone: string,
) {
  const existingReceiptOrder = await tx.receiptOrder.findFirst({
    where: {
      order: {
        tenantId,
        customerId,
        id: { not: orderId },
      },
    },
    orderBy: { id: "asc" },
    select: { receiptId: true },
  });

  let receiptId = existingReceiptOrder?.receiptId;
  if (receiptId) {
    await tx.receipt.update({
      where: { id: receiptId },
      data: { total: { increment: total } },
    });
  } else {
    await tx.$executeRaw`CREATE SEQUENCE IF NOT EXISTS "Receipt_number_seq"`;
    const [{ nextValue }] = await tx.$queryRaw<Array<{ nextValue: bigint }>>`
      SELECT nextval('"Receipt_number_seq"') AS "nextValue"
    `;
    const receipt = await tx.receipt.create({
      data: {
        number: `${businessDateKey(createdAt, timeZone).slice(0, 4)}-${String(nextValue).padStart(12, "0")}`,
        total,
      },
      select: { id: true },
    });
    receiptId = receipt.id;
  }

  await tx.receiptOrder.create({ data: { receiptId, orderId } });
}

export async function getOtherServiceSalesDefaultsAction() {
  const tenant = await getTenantContext();
  const today = businessDateKey(new Date(), tenant.timeZone);
  return { startDate: today, endDate: today, timeZone: tenant.timeZone };
}

export async function getOtherServiceSalesAction(startDate: string, endDate: string): Promise<OtherServiceSaleRow[]> {
  const tenant = await getTenantContext();
  if (!validDateKey(startDate) || !validDateKey(endDate)) {
    throw new Error("Enter a valid date range.");
  }
  if (startDate > endDate) throw new Error("The start date must be on or before the end date.");

  const { start } = businessDayRangeFromKey(startDate, tenant.timeZone);
  const { end } = businessDayRangeFromKey(endDate, tenant.timeZone);
  const orders = await db.laundryOrder.findMany({
    where: {
      tenantId: tenant.id,
      status: "COMPLETED",
      createdAt: { gte: start, lt: end },
      machineUsages: { none: {} },
      items: { some: { service: { type: "OTHERS" } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      total: true,
      orderType: true,
      paid: true,
      paymentMethod: true,
      comment: true,
      customer: { select: { name: true } },
      items: {
        select: {
          serviceId: true,
          inventoryItemId: true,
          quantity: true,
          price: true,
          service: { select: { name: true, type: true, pricingUnit: true } },
        },
      },
      payments: { select: { method: true }, take: 1 },
    },
  });

  return orders.flatMap((order) => {
    if (order.items.length !== 1) return [];
    const item = order.items[0];
    const serviceId = item.serviceId;
    const service = item.service;
    if (!serviceId || item.inventoryItemId || service?.type !== "OTHERS" || !order.customer) return [];
    return [{
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      createdAtLabel: new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: tenant.timeZone,
      }).format(order.createdAt),
      businessDate: businessDateKey(order.createdAt, tenant.timeZone),
      customerName: order.customer.name,
      serviceId,
      serviceName: service.name,
      pricingUnit: service.pricingUnit,
      quantity: item.quantity,
      unitPrice: item.price,
      total: order.total,
      orderType: order.orderType,
      paid: order.paid,
      paymentMethod: order.paymentMethod ?? order.payments[0]?.method ?? "",
      comment: order.comment ?? "",
    }];
  });
}

export async function createOtherServiceSaleAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenantContext = await getTenantContext();
    const { userId, orgId, orgSlug } = tenantContext;
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const paymentMethod = String(formData.get("paymentMethod") ?? "");
    const orderType = String(formData.get("orderType") ?? "WALK_IN");
    const paid = formData.get("paid") === "on";
    const comment = String(formData.get("comment") ?? "").trim();

    if (!userId || !orgId) throw new Error("You must be signed in to record a service sale.");
    if (!serviceId) throw new Error("Select an Other Service.");
    if (!customerName) throw new Error("Customer name is required.");
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Quantity must be a whole number greater than zero.");
    }
    if (!PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      throw new Error("A valid payment method is required.");
    }
    if (!ORDER_TYPES.includes(orderType as (typeof ORDER_TYPES)[number])) {
      throw new Error("A valid order type is required.");
    }
    if (comment.length > 500) throw new Error("Notes must not exceed 500 characters.");

    const order = await db.$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        where: { id: serviceId, tenantId: tenantContext.id, type: "OTHERS" },
        select: { id: true, price: true },
      });
      if (!service) throw new Error("The selected Other Service is not available for this shop.");

      let customer = await tx.customer.findFirst({
        where: { tenantId: tenantContext.id, name: customerName },
        select: { id: true },
      });
      if (!customer) {
        customer = await tx.customer.create({
          data: { tenantId: tenantContext.id, name: customerName },
          select: { id: true },
        });
      }

      const total = service.price * quantity;
      if (!Number.isFinite(total)) throw new Error("The service total is invalid.");

      const createdOrder = await tx.laundryOrder.create({
        data: {
          tenantId: tenantContext.id,
          userId,
          customerId: customer.id,
          status: "COMPLETED",
          orderType: orderType as (typeof ORDER_TYPES)[number],
          paymentMethod: paymentMethod as (typeof PAYMENT_METHODS)[number],
          total,
          comment,
          paid,
          paidAt: paid ? new Date() : null,
          items: {
            create: {
              serviceId: service.id,
              price: service.price,
              quantity,
            },
          },
          payments: {
            create: {
              amount: total,
              method: paymentMethod,
            },
          },
        },
        select: { id: true, createdAt: true },
      });

      await addOrderToCustomerReceipt(
        tx,
        tenantContext.id,
        customer.id,
        createdOrder.id,
        total,
        createdOrder.createdAt,
        tenantContext.timeZone,
      );

      return createdOrder;
    }, { maxWait: 10000, timeout: 15000 });

    revalidateOtherServicePaths(orgSlug);

    return {
      message: JSON.stringify([
        { message: "Other Service sale recorded successfully.", result: "success" },
        { orderId: order.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error recording Other Service sale:", error);
    return renderError(error);
  }
}

function revalidateOtherServicePaths(orgSlug: string | undefined) {
  if (!orgSlug) return;
  revalidatePath(`/tenants/${orgSlug}/tenantDashboard`);
  revalidatePath(`/tenants/${orgSlug}/tenantDashboard/sales`);
  revalidatePath(`/tenants/${orgSlug}/adminDashboard`);
}

export async function updateOtherServiceSaleAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const paymentMethod = String(formData.get("paymentMethod") ?? "");
    const orderType = String(formData.get("orderType") ?? "");
    const paid = formData.get("paid") === "on";
    const comment = String(formData.get("comment") ?? "").trim();
    if (!orderId || !serviceId || !customerName) throw new Error("Order, service, and customer are required.");
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a whole number greater than zero.");
    if (!PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) throw new Error("A valid payment method is required.");
    if (!ORDER_TYPES.includes(orderType as (typeof ORDER_TYPES)[number])) throw new Error("A valid order type is required.");
    if (comment.length > 500) throw new Error("Notes must not exceed 500 characters.");

    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({
        where: {
          id: orderId,
          tenantId: tenant.id,
          status: "COMPLETED",
          machineUsages: { none: {} },
          items: { some: { service: { type: "OTHERS" } } },
        },
        include: { items: true, payments: { select: { id: true } }, receiptOrders: true },
      });
      if (!order || order.items.length !== 1 || !order.items[0].serviceId || order.items[0].inventoryItemId) {
        throw new Error("Other Service sale not found.");
      }

      const service = await tx.service.findFirst({
        where: { id: serviceId, tenantId: tenant.id, type: "OTHERS" },
        select: { id: true, price: true },
      });
      if (!service) throw new Error("The selected Other Service is not available for this shop.");

      const customer = await tx.customer.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: customerName } },
        update: {},
        create: { tenantId: tenant.id, name: customerName },
        select: { id: true },
      });
      const oldItem = order.items[0];
      const unitPrice = oldItem.serviceId === service.id ? oldItem.price : service.price;
      const total = unitPrice * quantity;
      if (!Number.isFinite(total)) throw new Error("The service total is invalid.");

      await tx.orderItem.update({
        where: { id: oldItem.id },
        data: { serviceId: service.id, price: unitPrice, quantity },
      });
      await tx.laundryOrder.update({
        where: { id: order.id },
        data: {
          customerId: customer.id,
          total,
          orderType: orderType as (typeof ORDER_TYPES)[number],
          paymentMethod: paymentMethod as (typeof PAYMENT_METHODS)[number],
          paid,
          paidAt: paid ? order.paidAt ?? new Date() : null,
          comment: comment || null,
        },
      });

      if (order.payments.length > 0) {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { amount: total, method: paymentMethod },
        });
      } else {
        await tx.payment.create({ data: { orderId: order.id, amount: total, method: paymentMethod } });
      }

      if (order.customerId === customer.id && order.receiptOrders.length > 0) {
        for (const receiptOrder of order.receiptOrders) {
          await tx.receipt.update({
            where: { id: receiptOrder.receiptId },
            data: { total: { increment: total - order.total } },
          });
        }
      } else {
        await tx.receiptOrder.deleteMany({ where: { orderId: order.id } });
        for (const receiptOrder of order.receiptOrders) {
          await tx.receipt.update({
            where: { id: receiptOrder.receiptId },
            data: { total: { decrement: order.total } },
          });
          const remainingOrders = await tx.receiptOrder.count({ where: { receiptId: receiptOrder.receiptId } });
          if (remainingOrders === 0) {
            await tx.receipt.delete({ where: { id: receiptOrder.receiptId } });
          }
        }
        await addOrderToCustomerReceipt(
          tx,
          tenant.id,
          customer.id,
          order.id,
          total,
          order.createdAt,
          tenant.timeZone,
        );
      }
    }, { maxWait: 10000, timeout: 15000 });

    revalidateOtherServicePaths(tenant.orgSlug);
    return { message: JSON.stringify([{ message: "Other Service sale updated successfully.", result: "success" }]) };
  } catch (error: unknown) {
    console.error("Error updating Other Service sale:", error);
    return renderError(error);
  }
}

export async function deleteOtherServiceSaleAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const tenant = await getTenantContext();
    const orderId = String(formData.get("orderId") ?? "").trim();
    if (!orderId) throw new Error("Order id is required.");

    await db.$transaction(async (tx) => {
      const order = await tx.laundryOrder.findFirst({
        where: {
          id: orderId,
          tenantId: tenant.id,
          status: "COMPLETED",
          machineUsages: { none: {} },
          items: { some: { service: { type: "OTHERS" } } },
        },
        include: { items: true, receiptOrders: true },
      });
      if (!order || order.items.length !== 1 || !order.items[0].serviceId || order.items[0].inventoryItemId) {
        throw new Error("Other Service sale not found.");
      }

      await tx.receiptOrder.deleteMany({ where: { orderId: order.id } });
      for (const receiptOrder of order.receiptOrders) {
        await tx.receipt.update({
          where: { id: receiptOrder.receiptId },
          data: { total: { decrement: order.total } },
        });
        const remainingOrders = await tx.receiptOrder.count({ where: { receiptId: receiptOrder.receiptId } });
        if (remainingOrders === 0) {
          await tx.receipt.delete({ where: { id: receiptOrder.receiptId } });
        }
      }
      await tx.payment.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.laundryOrder.delete({ where: { id: order.id } });
    }, { maxWait: 10000, timeout: 15000 });

    revalidateOtherServicePaths(tenant.orgSlug);
    return { message: JSON.stringify([{ message: "Other Service sale deleted successfully.", result: "success" }]) };
  } catch (error: unknown) {
    console.error("Error deleting Other Service sale:", error);
    return renderError(error);
  }
}
