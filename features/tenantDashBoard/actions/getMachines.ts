// app/actions/getMachines.ts
"use server";

import db from '@/utils/db'

export async function getMachines(tenantId: string) {

    return await db.machineUsage.findMany({
        where: { tenantId },
        include: {
            order: { select: { status: true } },
            machine: { select: { id: true, type: true, name: true, status: true } },
        },
    });
}
