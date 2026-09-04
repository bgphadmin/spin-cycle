import dynamic from "next/dynamic"
// import type { DistributionRow } from "@/components/distribution/DistributionGrid"
// import { getDistributionsPerPage, getEmplpoyeeItems, getRiceItems } from "@/utils/actions"
import SkeletonTable from "@/components/utils/SkeletonTable"
// import verifyUser from "@/utils/userValidation"
import { redirect } from "next/navigation"
import { getTenantsPerPage } from "@/utils/actions/tenant/tenantAction"

const TenantManager = dynamic(
  () => import("@/components/tenant/TenantManager"),
  {
    ssr: false,
    loading: () => <SkeletonTable />,
  }
)


const TenantPage = async () => {
  // const isSuperuser = await verifyUser("SUPERUSER");
  // const isAdmin = await verifyUser("ADMIN");
  // if (!isSuperuser && !isAdmin) return redirect('/');

  const { safeRows: tenants, total } = await getTenantsPerPage({ pageIndex: 0, pageSize: 10 })

  const rows = tenants.map((record) => ({
    id: record.id,
    shopName: record.shopName,
    address: record.address,
    contactPerson: record.contactPerson,
    contactPosition: record.contactPosition,
    phone: record.phone,
    email: record.email,
    subscriptionStatus: record.subscriptionStatus,
    createdAt: new Date(record.createdAt),
  }))

  return (
    <section className="max-w-6xl mx-auto lg:px-12 pt-2 pb-18">
      <div className="bg-gray-50 rounded-lg shadow-md p-6">
        <TenantManager
          initialRows={rows}
          total={total}
        />
      </div>
    </section>
  )
}

export default TenantPage
