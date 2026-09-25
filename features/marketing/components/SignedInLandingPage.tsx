import { Button } from '@/components/ui/button'
import { SignedIn } from '@clerk/nextjs'
import db from '@/utils/db'
import Link from 'next/link'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { syncStaffToTenant } from '../action'


const SignedInLandingPage = async () => {
  const { userId, orgId, orgRole, orgSlug } = await auth()
  const user = userId
    ? await db.user.findUnique({
        where: { clerkId: userId },
        select: { tenantId: true, role: true },
      })
    : null
  let tenant = orgId
    ? await db.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { clerkOrgId: true, clerkOrgSlug: true },
      })
    : null
  let resolvedRole = orgRole

  if (!tenant && user?.tenantId) {
    tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
      select: { clerkOrgId: true, clerkOrgSlug: true },
    })
  }

  if (!tenant && userId) {
    const clerk = await clerkClient()
    const memberships = await clerk.users.getOrganizationMembershipList({ userId })
    const organizationIds = memberships.data.map(
      (membership) => membership.organization.id,
    )
    const organizationSlugs = memberships.data
      .map((membership) => membership.organization.slug)
      .filter((slug): slug is string => Boolean(slug))
    const tenants = organizationIds.length || organizationSlugs.length
      ? await db.tenant.findMany({
          where: {
            OR: [
              { clerkOrgId: { in: organizationIds } },
              { clerkOrgSlug: { in: organizationSlugs } },
            ],
          },
          select: { clerkOrgId: true, clerkOrgSlug: true },
        })
      : []
    const membership = memberships.data.find((item) =>
      tenants.some(
        (candidate) =>
          candidate.clerkOrgId === item.organization.id ||
          candidate.clerkOrgSlug === item.organization.slug,
      ),
    )
    if (membership) {
      tenant = tenants.find(
        (candidate) =>
          candidate.clerkOrgId === membership.organization.id ||
          candidate.clerkOrgSlug === membership.organization.slug,
      ) ?? null
      resolvedRole = membership.role
    }
  }

  const resolvedSlug = tenant?.clerkOrgSlug ?? orgSlug
  const isAdmin =
    resolvedRole === "org:admin" ||
    (tenant !== null && user?.role === "ADMIN")
  const isMember =
    resolvedRole === "org:member" ||
    (tenant !== null && user?.role === "STAFF")

  if (isAdmin && resolvedSlug) {
    return (
      <SignedIn>
          <Link href={`/tenants/${resolvedSlug}/tenantDashboard`}>
            <Button
              variant="standard"
              className="mb-3"

            >
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/inviteStaff">
            <Button
              variant="standard"
            >
              Invite Staff Members
            </Button>
          </Link>
      </SignedIn>
    )
  } else if (isMember && resolvedSlug) {
    const clerkId = await db.user.findUnique({
      where: { clerkId: userId || "" }
    })
    if (!clerkId) await syncStaffToTenant()

    return (
      <SignedIn>
        <Link href={`/tenants/${resolvedSlug}/tenantDashboard`}>
          <Button
            variant="standard"
          >
            Go to Dashboard
          </Button>
        </Link>
      </SignedIn>
    )
  } else return <></>

}

export default SignedInLandingPage
