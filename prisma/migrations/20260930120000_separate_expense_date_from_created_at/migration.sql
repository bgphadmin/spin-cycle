ALTER TABLE "Expense" ADD COLUMN "expenseDate" DATE;

UPDATE "Expense" AS expense
SET "expenseDate" = (
  (expense."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE tenant."timeZone"
)::DATE
FROM "Tenant" AS tenant
WHERE tenant."id" = expense."tenantId";

ALTER TABLE "Expense" ALTER COLUMN "expenseDate" SET NOT NULL;
