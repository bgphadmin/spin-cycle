"use server";

import { getAuthContext } from "@/lib/auth";
import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { MachineStatus, MachineType } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";

export async function getMachineByIdAction(id: string) {
    try {
        noStore();
        const { orgRole } = await getAuthContext()
        if (orgRole !== "org:admin") {
            throw new Error("Forbidden");
        }
        const machineData = await db.machine.findUnique({
            where: { id },
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
    const { sessionClaims } = auth();
    const tenantId = sessionClaims?.tenantId as string | undefined
    const id = formData.get("id") as string;
    try {
        const machine = await db.machine.update({
            where: { id, tenantId },
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
    const { sessionClaims } = auth();
    const tenantId = sessionClaims?.tenantId as string | undefined
    const id = formData.get("id") as string;

    try {
        await db.machine.delete({
            where: { id, tenantId },
        });

        return { message: "Machine deleted successfully" };
    } catch (error) {
        return { message: "Failed to delete machine" };
    }
}
