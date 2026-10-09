ALTER TABLE "Machine"
ADD COLUMN "maintenanceIntervalCycles" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN "cyclesSinceMaintenance" INTEGER NOT NULL DEFAULT 0;

UPDATE "Machine"
SET "cyclesSinceMaintenance" = "usageCount";

CREATE TABLE "MachineMaintenance" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cyclesAtMaintenance" INTEGER NOT NULL,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MachineMaintenance_tenantId_recordedAt_idx"
ON "MachineMaintenance"("tenantId", "recordedAt");

CREATE INDEX "MachineMaintenance_machineId_recordedAt_idx"
ON "MachineMaintenance"("machineId", "recordedAt");

ALTER TABLE "MachineMaintenance"
ADD CONSTRAINT "MachineMaintenance_machineId_fkey"
FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MachineMaintenance"
ADD CONSTRAINT "MachineMaintenance_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
