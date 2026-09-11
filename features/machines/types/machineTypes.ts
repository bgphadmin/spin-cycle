export type Machine = {
    id: string;
    name: string;
    type: "washer" | "dryer";
    status: string; // e.g., "active", "idle", "maintenance"
    usageCount: number;
    location?: string | null;
    comment?: string | null;
};