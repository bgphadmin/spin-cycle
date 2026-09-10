import { Button } from '@/components/ui/button'
import { getServerAuthClaims } from '@/utils/hooks/useAuthClaims'
import { SignedIn } from '@clerk/nextjs'
import db from '@/utils/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'


const SignedInLandingPage = async () => {
  const { orgRole, orgSlug, orgId } = await getServerAuthClaims()
  const tenant = await db.tenant.findFirst({
    where: { clerkOrgId: orgId },
  });

  if ((orgRole === "org:admin" && orgSlug) && !tenant) {
    redirect('/registerShop')
  }

  if (orgRole === "org:admin" && orgSlug) {
    return (
      <SignedIn>
        <Link href={`/tenants/${orgSlug}/adminStaff`}>
          <Button
            variant="standard"
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
  } else if (orgRole === "org:member" && orgSlug) {
    return (
      <SignedIn>
        <Link href={`/tenants/${orgSlug}/adminStaff/pos`}>
          <Button
            variant="standard"
          >
            Go to POS
          </Button>
        </Link>
      </SignedIn>
    )
  } else return <></>

}

export default SignedInLandingPage
