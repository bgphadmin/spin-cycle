ALTER TABLE "PettyCash" ADD COLUMN "expenseId" TEXT;

CREATE UNIQUE INDEX "PettyCash_expenseId_key" ON "PettyCash"("expenseId");

ALTER TABLE "PettyCash" ADD CONSTRAINT "PettyCash_expenseId_fkey"
    FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
