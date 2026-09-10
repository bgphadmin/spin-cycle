"use server"

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { inviteStaffSchema } from "@/utils/validation/tenantSchema";
import { revalidatePath } from "next/cache";


export async function inviteStaffAction(_prevState: unknown,
    formData: FormData): Promise<{ message: string }> {

    // Add try catch here...

    const { userId } = await auth();
    const { orgId, orgSlug } = await getServerAuthClaims()

    const fields = inviteStaffSchema.parse(Object.fromEntries(formData));
    const email = fields.email;

    // Clerk handles email + invite link
    const invite = await clerkClient.organizations.createOrganizationInvitation({
        organizationId: orgId as string,
        inviterUserId: userId || "",
        emailAddress: email,
        role: "org:member",
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`, 
    });

    revalidatePath(`{/tenants/${orgSlug}/admin/pos}`);
    return {
        message: JSON.stringify([
            { message: "Staff invite sent.", result: "success" },
        ]),
    };;
}