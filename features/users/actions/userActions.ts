"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import db from "@/utils/db";
import type { TenantUser } from "../types";
import { getAuthContext } from "@/lib/auth";

type TenantContext = {
  userId: string;
  orgId: string;
  orgSlug: string;
  tenantId: string;
};

async function getAdminTenantContext(tenantSlug?: string): Promise<TenantContext> {
  const { userId, orgId, orgRole, orgSlug } = await getAuthContext();
  if (!userId || orgRole !== "org:admin") {
    throw new Error("Forbidden");
  }

  const tenant = await db.tenant.findUnique({
    where: tenantSlug ? { clerkOrgSlug: tenantSlug } : { clerkOrgId: orgId ?? "" },
    select: { id: true, clerkOrgId: true, clerkOrgSlug: true },
  });
  if (!tenant || (orgId && tenant.clerkOrgId !== orgId)) {
    throw new Error("Tenant context is invalid");
  }

  const currentUser = await db.user.findFirst({
    where: { clerkId: userId, tenantId: tenant.id, role: "ADMIN" },
    select: { id: true },
  });
  if (!currentUser) {
    throw new Error("You are not an administrator for this tenant");
  }

  return {
    userId,
    orgId: tenant.clerkOrgId,
    orgSlug: orgSlug ?? tenant.clerkOrgSlug,
    tenantId: tenant.id,
  };
}

async function getTenantMemberships(orgId: string): Promise<TenantUser[]> {
  const clerk = await clerkClient();
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 500,
    orderBy: "-created_at",
  });

  return memberships.data.flatMap((membership) => {
    const publicUser = membership.publicUserData;
    if (!publicUser || (membership.role !== "org:admin" && membership.role !== "org:member")) {
      return [];
    }

    return [{
      clerkId: publicUser.userId,
      name: [publicUser.firstName, publicUser.lastName].filter(Boolean).join(" ") || publicUser.identifier,
      email: publicUser.identifier,
      role: membership.role,
    }];
  });
}

export async function getTenantUsersAction(tenantSlug?: string): Promise<TenantUser[]> {
  try {
    const context = await getAdminTenantContext(tenantSlug);
    return await getTenantMemberships(context.orgId);
  } catch (error) {
    console.error("Unable to load tenant users:", error);
    return [];
  }
}

export async function updateTenantUserRoleAction(
  tenantSlug: string,
  targetClerkId: string,
  role: "org:admin" | "org:member",
) {
  const context = await getAdminTenantContext(tenantSlug);
  if (!targetClerkId || !["org:admin", "org:member"].includes(role)) {
    throw new Error("Invalid user role");
  }
  if (targetClerkId === context.userId) {
    throw new Error("You cannot change your own organization role");
  }

  const clerk = await clerkClient();
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: context.orgId,
    limit: 500,
  });
  const membership = memberships.data.find(
    (item) => item.publicUserData?.userId === targetClerkId,
  );
  if (!membership) throw new Error("User is not a member of this organization");

  await clerk.organizations.updateOrganizationMembership({
    organizationId: context.orgId,
    userId: targetClerkId,
    role,
  });

  await db.user.updateMany({
    where: { clerkId: targetClerkId, tenantId: context.tenantId },
    data: { role: role === "org:admin" ? "ADMIN" : "STAFF" },
  });

  revalidatePath(`/tenants/${context.orgSlug}/adminDashboard/users`);
  return { success: true };
}
