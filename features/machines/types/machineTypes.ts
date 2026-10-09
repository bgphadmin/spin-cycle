export type Machine = {
    id: string;
    name: string;
    type: "washer" | "dryer";
    status: string; // e.g., "active", "idle", "maintenance"
    usageCount: number;
    maintenanceEnabled: boolean;
    maintenanceIntervalCycles: number;
    cyclesSinceMaintenance: number;
    lastMaintenanceAt?: Date | null;
    location?: string | null;
    comment?: string | null;
};