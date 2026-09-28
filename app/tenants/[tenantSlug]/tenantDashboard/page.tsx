import { getMachines } from '@/features/(pos)/tenantDashBoard/actions/getMachines';
import TenantDashboardTabs from '@/features/(pos)/tenantDashBoard/components/TenantDashboardTabs';
import { getInventoryItemsAction } from '@/features/inventory/actions/inventoryActions';
import { getOtherServiceSalesDefaultsAction } from '@/features/(pos)/tenantDashBoard/actions/createOtherServiceSaleAction';
import accessTenantIdServer from '@/lib/accessTenantIdServer';
import React from 'react'
import { string } from 'zod';

const TenantDashboardPage = async ({ params }: { params: { tenantSlug: string } }) => {
  // const tenantId = "tenant-123"; // replace with Clerk-authenticated tenant

  const tenantId = await accessTenantIdServer()

  const [machines, inventoryResult, otherServicesDateRange] = await Promise.all([
    getMachines(tenantId as string),
    getInventoryItemsAction(),
    getOtherServiceSalesDefaultsAction(),
  ]);

  // Map to props expected by MachineGrid
  const machineProps = machines.map(m => ({
    id: m.id,
    type: m.machine.type, // "washer" | "dryer"
    status: m.order?.status ?? "PENDING",
  }));

  return (
    // <main className="mx-auto w-full max-w-1xl px-20 mt-10 mb-25" >
    <main className="mx-auto w-full max-w-5xl px-16 mt-10 mb-25">
      <TenantDashboardTabs
        inventoryItems={inventoryResult.inventoryItems}
        tenantSlug={params.tenantSlug}
        otherServicesDateRange={otherServicesDateRange}
      />
    </main>
  )
}

export default TenantDashboardPage
