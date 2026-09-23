"use server";

import { clerkClient } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { getAuthContext } from "@/lib/auth";

export async function getMachinesAction(
  tenantSlug?: string,
): Promise<{ machines: any[]; error?: string }> {
  try {
    const { userId, orgId } = await getAuthContext();

    if (!userId) throw new Error("You must be signed in to view machines.");
    if (!tenantSlug && !orgId) throw new Error("Tenant context is required.");

    const tenant = await db.tenant.findUnique({
      where: tenantSlug ? { clerkOrgSlug: tenantSlug } : { clerkOrgId: orgId ?? "" },
      select: { id: true, clerkOrgId: true },
    });

    if (!tenant) throw new Error("Tenant not found.");

    const tenantUser = await db.user.findFirst({
      where: { clerkId: userId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!tenantUser) {
      const clerk = await clerkClient();
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });
      const isMember = memberships.data.some(
        (membership) =>
          membership.organization.id === tenant.clerkOrgId &&
          (membership.role === "org:admin" || membership.role === "org:member"),
      );
      if (!isMember) throw new Error("You are not a member of this tenant.");
    }

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