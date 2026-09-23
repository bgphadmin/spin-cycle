CREATE SEQUENCE "LaundryOrder_receiptNumber_seq";

ALTER TABLE "LaundryOrder"
ADD COLUMN "receiptNumber" INTEGER NOT NULL DEFAULT nextval('"LaundryOrder_receiptNumber_seq"');

ALTER SEQUENCE "LaundryOrder_receiptNumber_seq"
OWNED BY "LaundryOrder"."receiptNumber";

CREATE UNIQUE INDEX "LaundryOrder_receiptNumber_key" ON "LaundryOrder"("receiptNumber");
