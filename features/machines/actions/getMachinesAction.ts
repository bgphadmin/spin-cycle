"use server";

import db from "@/utils/db";
import { getAuthContext } from "@/lib/auth";

export async function getMachinesAction(
  tenantSlug?: string,
): Promise<{ machines: any[]; error?: string }> {
  try {
    const { userId, orgId, tenantId } = await getAuthContext();

    if (!userId) throw new Error("You must be signed in to view machines.");
    if (!tenantSlug && !tenantId && !orgId) throw new Error("Tenant context is required.");

    const tenant = await db.tenant.findUnique({
      where: tenantId
        ? { id: tenantId }
        : orgId
          ? { clerkOrgId: orgId }
          : { clerkOrgSlug: tenantSlug! },
      select: { id: true },
    });

    if (!tenant) throw new Error("Tenant not found.");

    const machines = await db.machine.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return { machines };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load machines.";
    console.error("Error fetching machines:", error);
    return { machines: [], error: message };
  }
}