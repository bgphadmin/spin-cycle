CREATE TABLE "LpgCylinder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emptiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LpgCylinder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LpgCylinder_tenantId_filledAt_idx"
ON "LpgCylinder"("tenantId", "filledAt");

ALTER TABLE "LpgCylinder"
ADD CONSTRAINT "LpgCylinder_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
