CREATE TABLE "PettyCash" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashDate" DATE NOT NULL,

    CONSTRAINT "PettyCash_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PettyCash_tenantId_cashDate_idx" ON "PettyCash"("tenantId", "cashDate");
CREATE INDEX "PettyCash_userId_idx" ON "PettyCash"("userId");

ALTER TABLE "PettyCash" ADD CONSTRAINT "PettyCash_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PettyCash" ADD CONSTRAINT "PettyCash_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
