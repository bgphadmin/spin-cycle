"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { addMachineSchema } from "@/utils/validation/machineSchema";

export async function addMachineAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    // 1. Clerk authentication
    const { userId } = await auth();
    const { orgId, orgRole } = await getServerAuthClaims();

    if (orgRole !== "org:admin") {
      throw new Error("This transaction is not allowed at your level.")
    }

    if (!userId) {
      throw new Error("You must be signed in to add a machine.");
    }
    if (!orgId) {
      throw new Error("Organization context is required to add a machine.");
    }

    // 2. Validate form fields with Zod schema
    const fields = addMachineSchema.parse(Object.fromEntries(formData));
    const { name, type, location, comment } = fields;

    // 3. Transaction: insert machine record
    const machine = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { id: true },
      });

      if (!tenant) {
        throw new Error("Tenant not found for this organization.");
      }

      const newMachine = await tx.machine.create({
        data: {
          tenantId: tenant.id,
          name,
          type,
          location: location || null,
          comment,
          status: "available",
          usageCount: 0,
        },
      });

      return newMachine;
    });

    // 4. Return success message
    return {
      message: JSON.stringify([
        { message: "Machine added successfully.", result: "success" },
        { machineId: machine.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding machine:", error);
    return renderError(error);
  }
}