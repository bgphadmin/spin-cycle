
import React from 'react'

export default async function page({ params }: { params: Promise<{ tenantId: string }> }) {

    const { tenantId } = await params
    return (
        <div>
            Tenant: {tenantId}
        </div>
    )
}



