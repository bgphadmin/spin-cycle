"use server";

import { auth } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { registerShopSchema } from "@/utils/validation/tenantSchema";

export async function registerShopAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    const { userId } = auth();

    if (!userId) {
      throw new Error("You must be signed in to register a shop.");
    }

    const fields = registerShopSchema.parse(Object.fromEntries(formData));

    const result = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, tenantId: true },
      });

      if (existingUser?.tenantId) {
        throw new Error("Your shop is already set up.");
      }

      const tenant = await tx.tenant.create({
        data: {
          ...fields,
          subscriptionStatus: "REGULAR",
        },
      });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { tenantId: tenant.id },
        });
      } else {
        await tx.user.create({
          data: {
            clerkId: userId,
            tenantId: tenant.id,
            name: fields.contactPerson,
            role: "ADMIN",
          },
        });
      }

    //  TODO: Add the following code to update the user's public metadata with the tenantId after creating the tenant. This will ensure that the user has access to their shop after registration.   
    // await clerkClient.users.updateUserMetadata(userId, {
    // publicMetadata: { tenantId: tenant.id },
    //   });

      return tenant;
    });

    return {
      message: JSON.stringify([
        { message: "Shop registered successfully.", result: "success" },
        { tenantId: result.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error registering shop:", error);
    return renderError(error);
  }
}
