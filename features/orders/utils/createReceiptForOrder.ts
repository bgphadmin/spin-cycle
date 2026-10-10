import type { Prisma } from "@prisma/client";
import { businessDateKey, businessDayRangeFromKey } from "@/utils/businessDate";
import { formatReceiptNumber, getReceiptNumberBase } from "@/features/orders/utils/receiptNumber";

export async function createReceiptForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  total: number,
  createdAt: Date,
  timeZone: string,
) {
  const order = await tx.laundryOrder.findUniqueOrThrow({
    where: { id: orderId },
    select: { tenantId: true, customerId: true },
  });
  const dateKey = businessDateKey(createdAt, timeZone);
  const { start, end } = businessDayRangeFromKey(dateKey, timeZone);
  const lockKey = `${order.tenantId}:${order.customerId ?? orderId}:${dateKey}`;

  await tx.$queryRaw<Array<{ locked: number }>>`
    SELECT 1 AS "locked"
    FROM (SELECT pg_advisory_xact_lock(hashtext(${lockKey}))) AS advisory_lock
  `;

  const relatedOrders = order.customerId
    ? await tx.laundryOrder.findMany({
        where: {
          tenantId: order.tenantId,
          customerId: order.customerId,
          createdAt: { gte: start, lt: end },
        },
        select: { id: true },
      })
    : [{ id: orderId }];
  const existingReceipts = await tx.receiptOrder.findMany({
    where: { orderId: { in: relatedOrders.map(({ id }) => id).filter((id) => id !== orderId) } },
    select: {
      receipt: { select: { id: true, number: true } },
    },
    orderBy: { receipt: { number: "asc" } },
  });

  let base: string;
  if (existingReceipts.length > 0) {
    base = getReceiptNumberBase(existingReceipts[0].receipt.number);
    for (const [index, existingReceipt] of existingReceipts.entries()) {
      const number = formatReceiptNumber(base, index);
      if (existingReceipt.receipt.number !== number) {
        await tx.receipt.update({
          where: { id: existingReceipt.receipt.id },
          data: { number },
        });
      }
    }
  } else {
    await tx.$executeRaw`CREATE SEQUENCE IF NOT EXISTS "Receipt_number_seq"`;
    const [{ nextValue }] = await tx.$queryRaw<Array<{ nextValue: bigint }>>`
      SELECT nextval('"Receipt_number_seq"') AS "nextValue"
    `;
    base = `${dateKey.slice(0, 4)}-${String(nextValue).padStart(12, "0")}`;
  }

  const receipt = await tx.receipt.create({
    data: {
      number: formatReceiptNumber(base, existingReceipts.length),
      total,
    },
    select: { id: true },
  });

  await tx.receiptOrder.create({ data: { receiptId: receipt.id, orderId } });
}
