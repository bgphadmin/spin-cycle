export function getMaintenanceStatus(
  cyclesSinceMaintenance: number,
  maintenanceIntervalCycles: number,
) {
  const dueSoonAt = Math.ceil(maintenanceIntervalCycles * 0.9);
  const cyclesRemaining = Math.max(0, maintenanceIntervalCycles - cyclesSinceMaintenance);

  if (cyclesSinceMaintenance >= maintenanceIntervalCycles) {
    return { status: "due" as const, cyclesRemaining: 0 };
  }
  if (cyclesSinceMaintenance >= dueSoonAt) {
    return { status: "soon" as const, cyclesRemaining };
  }
  return { status: "ok" as const, cyclesRemaining };
}
