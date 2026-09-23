import MachinesList from '@/features/machines/components/MachinesList'
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from 'react'

const MachineListPage = async ({ params }: { params: { tenantSlug: string } }) => {
    const { orgRole } = await getAuthContext();
    if (orgRole !== "org:admin") redirect("/not-allowed");

    return (
        <main className="mx-auto w-full max-w-3xl px-6 mt-10 mb-25" style={{ paddingBottom: 0 }}>
            <MachinesList tenantSlug={params.tenantSlug} />
        </main>
    )
}

export default MachineListPage
