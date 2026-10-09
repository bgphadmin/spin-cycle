"use server";

import { getAuthContext } from "@/lib/auth";
import db from "@/utils/db";
import { MachineStatus, MachineType } from "@prisma/client";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { addMachineSchema } from "@/utils/validation/machineSchema";
import { renderError } from "@/utils/error";

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
        const fields = addMachineSchema.parse({
            name: formData.get("name"),
            type: formData.get("type"),
            usageCount: formData.get("usageCount"),
            maintenanceEnabled: formData.getAll("maintenanceEnabled").includes("true"),
            maintenanceIntervalCycles:
                formData.get("maintenanceIntervalCycles") ?? existingMachine.maintenanceIntervalCycles,
            location: formData.get("location"),
            comment: formData.get("comment"),
        });
        const machine = await db.machine.update({
            where: { id: existingMachine.id },
            data: {
                name: fields.name,
                type: fields.type as MachineType,
                status: formData.get("status") as MachineStatus,
                usageCount: fields.usageCount,
                maintenanceEnabled: fields.maintenanceEnabled,
                maintenanceIntervalCycles: fields.maintenanceIntervalCycles,
                location: fields.location || null,
                comment: fields.comment || null,
            },
        });

        revalidatePath("/tenants/[tenantSlug]/tenantDashboard/machines", "page");
        return {
            message: JSON.stringify([
                { message: "Machine info updated successfully" },
                { result: "success" },
                { machine }
            ]),
        };
    } catch (error) {
        console.error("Failed to update machine:", error);
        return renderError(error);
    }

}

export async function recordMachineMaintenanceAction(machineId: string, notes: string) {
    try {
        const tenantId = await getAdminTenantId();
        if (typeof machineId !== "string" || !machineId.trim()) {
            throw new Error("Machine id is required.");
        }
        if (typeof notes !== "string") {
            throw new Error("Maintenance notes must be text.");
        }
        const normalizedNotes = notes.trim();
        const normalizedMachineId = machineId.trim();
        if (normalizedNotes.length > 500) {
            throw new Error("Maintenance notes cannot exceed 500 characters.");
        }

        const record = await db.$transaction(async (tx) => {
            const machine = await tx.machine.findFirst({
                where: { id: normalizedMachineId, tenantId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    maintenanceEnabled: true,
                    cyclesSinceMaintenance: true,
                },
            });
            if (!machine) throw new Error("Machine not found.");
            if (!machine.maintenanceEnabled) {
                throw new Error("Maintenance tracking is disabled for this machine.");
            }
            if (machine.status === MachineStatus.IN_USE) {
                throw new Error("Complete or cancel the active cycle before recording maintenance.");
            }

            const reset = await tx.machine.updateMany({
                where: {
                    id: machine.id,
                    tenantId,
                    maintenanceEnabled: true,
                    status: { not: MachineStatus.IN_USE },
                },
                data: { cyclesSinceMaintenance: 0 },
            });
            if (reset.count !== 1) {
                throw new Error("The machine started a cycle. Complete or cancel it before recording maintenance.");
            }

            const maintenance = await tx.machineMaintenance.create({
                data: {
                    machineId: machine.id,
                    tenantId,
                    cyclesAtMaintenance: machine.cyclesSinceMaintenance,
                    notes: normalizedNotes || null,
                },
            });
            return { maintenance, machineName: machine.name };
        });

        revalidatePath("/tenants/[tenantSlug]/tenantDashboard/machines", "page");
        return {
            message: JSON.stringify([
                { message: `Maintenance recorded for ${record.machineName}.`, result: "success" },
                { cyclesAtMaintenance: record.maintenance.cyclesAtMaintenance },
            ]),
        };
    } catch (error) {
        console.error("Failed to record machine maintenance:", error);
        return renderError(error);
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
