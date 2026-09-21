DROP INDEX IF EXISTS "Customer_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_tenantId_name_key"
ON "Customer"("tenantId", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Customer_tenantId_fkey'
  ) THEN
    ALTER TABLE "Customer"
    ADD CONSTRAINT "Customer_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
