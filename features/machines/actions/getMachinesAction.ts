"use server";

import db from "@/utils/db";
import { getAuthContext } from "@/lib/auth";

export async function getMachinesAction(): Promise<{ machines: any[] }> {
  try {
    const { userId, orgRole, orgId } = await getAuthContext();

    if (!userId) throw new Error("You must be signed in to view machines.");
    if (orgRole !== "org:admin") throw new Error("Only administrators can view machines.");
    if (!orgId) throw new Error("Organization context is required.");

    const tenant = await db.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) throw new Error("Tenant not found for this organization.");

    const machines = await db.machine.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return { machines };
  } catch (error: unknown) {
    console.error("Error fetching machines:", error);
    return { machines: [] };
  }
}