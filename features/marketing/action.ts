"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import db from "@/utils/db";

export async function syncStaffToTenant() {
  const { userId } = auth();
  if (!userId) throw new Error("Not signed in");

  // Get Clerk user + their org memberships
  const user = await clerkClient.users.getUser(userId);
  const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });

  // Loop through memberships (usually just one)
  for (const membership of memberships.data) {
    const orgId = membership.organization.id;
    const role = membership.role;

    // Find tenant by Clerk orgId
    const tenant = await db.tenant.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (tenant) {
      // Upsert staff user into Supabase/Prisma
      await db.user.upsert({
        where: { clerkId: userId },
        update: {
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          tenantId: tenant.id,
          role: "STAFF",
        },
        create: {
          clerkId: userId,
          email: user.emailAddresses[0].emailAddress,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          tenantId: tenant.id,
          role: "STAFF",
        },
      });
    }
  }
}