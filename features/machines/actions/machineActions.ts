"use server";

import { getAuthContext } from "@/lib/auth";
import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";
import { MachineType } from "@prisma/client";

export async function getMachineByIdAction(id: string) {
    try {
        const { orgRole } = await getAuthContext()
        if (orgRole !== "org:admin") {
            throw new Error("Forbidden");
        }
        const machineData = await db.machine.findUnique({
            where: { id },
        });
        return machineData
    } catch (error) {
        console.log ("Something went wrong");
        return null
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
                status: formData.get("status") as string,
                usageCount: Number(formData.get("usageCount")),
                location: formData.get("location") as string,
                comment: formData.get("comment") as string,
            },
        });

        return {
            message: JSON.stringify([
                { message: "Rice item updated successfully" },
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

