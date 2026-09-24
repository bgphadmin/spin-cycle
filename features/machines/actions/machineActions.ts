"use server";

import { getAuthContext } from "@/lib/auth";
import db from "@/utils/db";
import { MachineStatus, MachineType } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";

async function getAdminTenantId() {
    const { userId, orgRole, orgId, tenantId } = await getAuthContext();
    if (!userId || orgRole !== "org:admin") {
        throw new Error("Forbidden");
    }

    const tenant = await db.tenant.findUnique({
        where: tenantId
            ? { id: tenantId }
            : { clerkOrgId: orgId ?? "" },
        select: { id: true },
    });
    if (!tenant) throw new Error("Tenant not found");

    return tenant.id;
}

export async function getMachineByIdAction(id: string) {
    try {
        noStore();
        const tenantId = await getAdminTenantId();
        const machineData = await db.machine.findUnique({
            where: { id, tenantId },
        });
        return machineData
    } catch (error) {
        return { message: "Something went wrong" };
    }
}

export async function updateMachineAction(
    prevState: unknown,
    formData: FormData,
): Promise<{ message: string }> {
    const id = formData.get("id") as string;
    try {
        const tenantId = await getAdminTenantId();
        const existingMachine = await db.machine.findFirst({ where: { id, tenantId } });
        if (!existingMachine) return { message: "Machine not found" };
        const machine = await db.machine.update({
            where: { id: existingMachine.id },
            data: {
                name: formData.get("name") as string,
                type: formData.get("type") as MachineType,
                status: formData.get("status") as MachineStatus,
                usageCount: Number(formData.get("usageCount")),
                location: formData.get("location") as string,
                comment: formData.get("comment") as string,
            },
        });

        return {
            message: JSON.stringify([
                { message: "Machine info updated successfully" },
                { result: "success" },
                { machine }
            ]),
        };
    } catch (error) {
        return { message: "Failed to update machine" };
    }
}

export async function deleteMachineAction(
    prevState: unknown,
    formData: FormData
): Promise<{ message: string }> {
    const id = formData.get("id") as string;

    try {
        const tenantId = await getAdminTenantId();
        const machine = await db.machine.findFirst({
            where: { id, tenantId },
            select: { id: true, status: true },
        });
        if (!machine) return { message: "Machine not found" };
        if (machine.status === MachineStatus.IN_USE) {
            return { message: "An in-use machine cannot be deleted." };
        }

        await db.$transaction(async (tx) => {
            await tx.machineUsage.deleteMany({ where: { machineId: machine.id } });
            await tx.machine.delete({ where: { id: machine.id } });
        });

        return { message: "Machine deleted successfully" };
    } catch (error) {
        console.error("Failed to delete machine:", error);
        return { message: "Failed to delete machine" };
    }
}
