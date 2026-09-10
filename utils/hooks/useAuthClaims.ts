'use server'
import { auth } from '@clerk/nextjs/server'
import { useSession } from '@clerk/nextjs'

// 1. Define a shared typescript structure for reliability
export interface ActiveOrgClaims {
  orgRole?: string
  orgSlug?: string
  orgName?: string
  orgId?: string
}

/**
 * 🖥️ SERVER UTILITY (Async)
 * For use strictly inside Server Components, Actions, or Route Handlers.
 */
export async function getServerAuthClaims() {
  const { sessionClaims } = await auth();

  const { orgRole, orgSlug, orgName, orgId } = (sessionClaims ?? {}) as ActiveOrgClaims;

  return {
    orgRole,
    orgSlug,
    orgName,
    orgId
  };
}