// app/actions/createOrder.ts
"use server";

import { getAuthContext } from "@/lib/auth";
import db from "@/utils/db";
import { z } from "zod";
import { orderSchema } from "@/utils/validation/orderSchema";
import { renderError } from "@/utils/error";


export async function createOrderAction(
    prevState: unknown,
    formData: FormData
): Promise<{ message: string }> {
    try {
        const { userId, orgId } = await getAuthContext();

        console.log("Form Data: ", formData)

        // Validate form data
        const parsed = orderSchema.parse({
            machineId: formData.get("machineId"),
            customerName: formData.get("customerName"),
            serviceId: formData.get("serviceId"),
            paymentMethod: formData.get("paymentMethod"),
            inventoryItemId: formData.get("inventoryItemId") ?? undefined,
            quantity: formData.get("quantity"),
        });

        // Lookup service
        const service = await db.service.findUnique({
            where: { id: parsed.serviceId },
        });
        if (!service) throw new Error("Service not found");

        const total = service.price * parsed.quantity;

        // Create customer
        const customer = await db.customer.create({
            data: { name: parsed.customerName, tenantId: orgId! },
        });

        // Create order
        const order = await db.laundryOrder.create({
            data: {
                tenantId: orgId!,
                userId: userId!,
                status: "PENDING",
                paymentMethod: parsed.paymentMethod,
                total,
                customerId: customer.id,
                items: {
                    create: [
                        {
                            serviceId: service.id,
                            price: service.price,
                            quantity: parsed.quantity,
                            inventoryItemId: parsed.inventoryItemId as string,
                        },
                    ],
                },
                machineUsages: {
                    create: {
                        machineId: parsed.machineId,
                        cycleType: service.name,
                        duration: service.duration ?? 30,
                        fee: service.price,
                        tenantId: orgId!,
                    },
                },
                payments: {
                    create: {
                        amount: total,
                        method: parsed.paymentMethod,
                    },
                },
            },
        });

        // Deduct inventory if consumable used
        if (parsed.inventoryItemId) {
            await db.inventoryTransaction.create({
                data: {
                    inventoryItemId: parsed.inventoryItemId,
                    tenantId: orgId!,
                    type: "usage",
                    quantity: parsed.quantity,
                    unitPrice: service.price,
                },
            });

            await db.inventoryItem.update({
                where: { id: parsed.inventoryItemId },
                data: { stock: { decrement: parsed.quantity } },
            });
        }

        return {
            message: JSON.stringify([
                {
                    message: "Sale order was successfully added.",
                    result: "success"
                },
            ]),
        };
    } catch (error) {
        return renderError(error);
    }
}