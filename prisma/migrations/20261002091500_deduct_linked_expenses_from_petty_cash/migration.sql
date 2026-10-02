UPDATE "PettyCash"
SET "amount" = -ABS("amount")
WHERE "expenseId" IS NOT NULL
  AND "amount" > 0;
