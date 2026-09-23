import MachinesList from '@/features/machines/components/MachinesList'
import React from 'react'

const MachineListPage = ({ params }: { params: { tenantSlug: string } }) => {
    return (
        <main className="mx-auto w-full max-w-3xl px-6 mt-10 mb-25" style={{ paddingBottom: 0 }}>
            <MachinesList tenantSlug={params.tenantSlug} />
        </main>
    )
}

export default MachineListPage
