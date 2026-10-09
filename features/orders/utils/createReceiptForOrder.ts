import type { Prisma } from "@prisma/client";
import { businessDateKey } from "@/utils/businessDate";

export async function createReceiptForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  total: number,
  createdAt: Date,
  timeZone: string,
) {
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

  await tx.receiptOrder.create({ data: { receiptId: receipt.id, orderId } });
}
