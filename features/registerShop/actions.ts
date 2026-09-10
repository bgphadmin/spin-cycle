"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import db from "@/utils/db";
import { renderError } from "@/utils/error";
import { registerShopSchema } from "@/utils/validation/tenantSchema";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

export async function registerShopAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {
  try {
    // 1. Properly await the async auth utility
    const { userId } = await auth();
    const { orgId, orgSlug } = await getServerAuthClaims()

    if (!userId) {
      throw new Error("You must be signed in to register a shop.");
    }

    const fields = registerShopSchema.parse(Object.fromEntries(formData));
    const email = fields.email;

    if (!email) {
      throw new Error("Email is required to register a shop.");
    }

    const tenant = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, tenantId: true },
      });

      if (existingUser?.tenantId) {
        throw new Error("Your shop is already set up.");
      }

      const newTenant = await tx.tenant.create({
        data: {
          ...fields,
          clerkOrgId: orgId as string,
          clerkOrgSlug: orgSlug as string,
          email: fields.email || "",
          subscriptionStatus: "PREMIUM",
        },
      });

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { tenantId: newTenant.id },
        });
      } else {
        await tx.user.create({
          data: {
            clerkId: userId,
            tenantId: newTenant.id,
            name: fields.contactPerson,
            role: "ADMIN",
            email,
          },
        });
      }

      // Update Clerk public metadata
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          tenantId: newTenant.id, // attach tenantId
        },
      });

      return newTenant;

    });

    // 3. Make external Clerk API calls AFTER database transaction succeeds safely
    const clerk = await clerkClient();

    // Clerk's update API natively performs deep-merging on metadata fields,
    // so you don't need to manually read and re-spread existing data.
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        tenantId: tenant.id,
      },
    });

    return {
      message: JSON.stringify([
        { message: "Shop registered successfully.", result: "success" },
        { tenantId: tenant.id },
      ]),
    };
  } catch (error: unknown) {
    console.error("Error registering shop:", error);
    return renderError(error);
  }
}