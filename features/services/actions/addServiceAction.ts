"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { addServiceSchema } from "@/utils/validation/serviceSchema";

export async function addServiceAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { userId } = await auth();
    const { orgId, orgRole } = await getServerAuthClaims();

    if (orgRole !== "org:admin") {
      throw new Error("This transaction is not allowed at your level.");
    }

    if (!userId) {
      throw new Error("You must be signed in to add a service.");
    }

    if (!orgId) {
      throw new Error("Organization context is required to add a service.");
    }

    const fields = addServiceSchema.parse(Object.fromEntries(formData));

    const service = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { id: true },
      });

      if (!tenant) {
        throw new Error("Tenant not found for this organization.");
      }

      return tx.service.create({
        data: {
          tenantId: tenant.id,
          type: fields.type,
          name: fields.name,
          price: fields.price,
          duration: fields.duration === "" ? null : fields.duration,
        },
      });
    });

    return {
      message: JSON.stringify([
        { message: "Service added successfully.", result: "success" },
        { serviceId: service.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error adding service:", error);
    return renderError(error);
  }
}
