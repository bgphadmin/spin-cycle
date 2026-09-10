import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";

export async function getAuthContext() {
  const { userId, orgId, orgRole, orgSlug, sessionClaims } = await auth();

  if (!userId) {
    return {
      userId: null,
      orgId: orgId ?? undefined,
      orgRole: orgRole ?? undefined,
      orgSlug: orgSlug ?? undefined,
    };
  }

  // This application stores organizations as Tenant records, so users may
  // have a tenantId claim without Clerk organization claims.
  const tenantId = sessionClaims?.tenantId as string | undefined;
  const user = tenantId
    ? await db.user.findUnique({
        where: { clerkId: userId },
        select: { tenantId: true, role: true },
      })
    : null;

  const databaseTenantId = user?.tenantId ?? tenantId;
  const databaseRole =
    user?.role === "ADMIN"
      ? "org:admin"
      : user?.role === "STAFF"
        ? "org:member"
        : undefined;

  return {
    userId,
    orgId: orgId ?? undefined,
    orgRole: orgRole ?? databaseRole,
    // Tenant IDs are the route identifier used by this application.
    orgSlug: orgSlug ?? databaseTenantId,
  };
}
