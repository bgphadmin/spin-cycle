'use client'
import { useSession } from '@clerk/nextjs'

// 1. Define a shared typescript structure for reliability
export interface ActiveOrgClaims {
  orgRole?: string
  orgSlug?: string
  orgName?: string
  orgId?: string
}

/**
 * 📱 CLIENT HOOK (React State)
 * For use strictly inside Client Components ("use client").
 */
export function useClientAuthClaims() {
  const { session } = useSession();

  // Read the active token claims straight out of the React hook environment
  const sessionClaims = session?.lastActiveToken?.jwt?.claims;
  const { orgRole, orgSlug, orgName, orgId } = (sessionClaims ?? {}) as ActiveOrgClaims;

  return {
    orgRole,
    orgSlug,
    orgName,
    orgId,
    isLoaded: !!session,
  };
}