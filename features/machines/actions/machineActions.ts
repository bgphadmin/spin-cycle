"use server";

import db from "@/utils/db";
import { auth } from "@clerk/nextjs/server";

export async function getMachineByIdAction(id: string) {
    const { sessionClaims } = auth();
    const tenantId = sessionClaims?.tenantId as string | undefined
    return db.machine.findUnique({
        where: { id, tenantId },
    });
}

export async function updateMachineAction(
    prevState: unknown,
    formData: FormData,
): Promise<{ message: string }> {
    const { sessionClaims } = auth();
    const tenantId = sessionClaims?.tenantId as string | undefined
    const id = formData.get("id") as string;
    try {
        await db.machine.update({
            where: { id, tenantId },
            data: {
                name: formData.get("name") as string,
                type: formData.get("type") as string,
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

