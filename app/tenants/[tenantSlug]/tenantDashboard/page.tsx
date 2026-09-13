import { getMachines } from '@/features/(pos)/tenantDashBoard/actions/getMachines';
import { MachineGrid } from '@/features/(pos)/tenantDashBoard/components/MachineGrid';
import accessTenantIdServer from '@/lib/accessTenantIdServer';
import React from 'react'
import { string } from 'zod';

const TenantDashboardPage = async () => {
  // const tenantId = "tenant-123"; // replace with Clerk-authenticated tenant

  const tenantId = await accessTenantIdServer()

  const machines = await getMachines(tenantId as string);

  // Map to props expected by MachineGrid
  const machineProps = machines.map(m => ({
    id: m.id,
    type: m.machine.type, // "washer" | "dryer"
    status: m.order?.status ?? "PENDING",
  }));

  return (
    <main className="mx-auto w-full max-w-1xl px-6 mt-10 mb-25" >
      <div className="flex justify-start">
        <MachineGrid machines={machineProps} />
      </div>
    </main>
  )
}

export default TenantDashboardPage
