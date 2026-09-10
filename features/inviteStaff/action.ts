// // features/onboarding/actions.ts
"use server"

// import { renderError } from '@/utils/error';
// import { getServerAuthClaims } from '@/utils/hooks/useAuthClaims';
// import { inviteStaffSchema } from '@/utils/validation/tenantSchema';
// import { auth, clerkClient } from '@clerk/nextjs/server';
// import { revalidatePath } from 'next/cache';

// export async function inviteStaffAction(_prevState: unknown,
//     formData: FormData): Promise<{ message: string }> {
//     try {

//         const fields = inviteStaffSchema.parse(Object.fromEntries(formData));
//         const email = fields.email;

//         // 1. Destructure the current user's clerk userId alongside orgId and orgRole
//         const { userId } = await auth();
//         const { orgId, orgRole, orgSlug } = await getServerAuthClaims()

//         // 2. Ensure both fields exist to satisfy TypeScript and application security
//         if (!orgId || !userId) {
//             throw new Error("Unauthorized: Please log in.");
//         }

//         if (orgRole !== 'org:admin') {
//             throw new Error("Forbidden: Only shop admins can invite staff.")
//         }

//         const client = await clerkClient();

//         // 3. Inject inviterUserId into the Clerk parameters payload
//         await client.organizations.createOrganizationInvitation({
//             organizationId: orgId,
//             inviterUserId: userId, // 👈 FIXES THE TS ERROR: Tracks who sent the link
//             emailAddress: email,
//             role: "org:member",
//             redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/signUp`,
//         });

//         revalidatePath(`{/tenants/${orgSlug}/admin/pos}`);
//         return {
//             message: JSON.stringify([
//                 { message: "Staff invite sent.", result: "success" },
//             ]),
//         };
//     } catch (error: unknown) {
//         console.error("Error registering shop:", error);
//         return renderError(error);
//     }
// }


import { auth, clerkClient } from "@clerk/nextjs/server";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { inviteStaffSchema } from "@/utils/validation/tenantSchema";
import { revalidatePath } from "next/cache";


export async function inviteStaffAction(_prevState: unknown,
    formData: FormData): Promise<{ message: string }> {

    // Add try catch here...

    const { userId } = await auth();
    const { orgId, orgRole, orgSlug } = await getServerAuthClaims()

    const fields = inviteStaffSchema.parse(Object.fromEntries(formData));
    const email = fields.email;

    // Clerk handles email + invite link
    const invite = await clerkClient.organizations.createOrganizationInvitation({
        organizationId: orgId as string,
        inviterUserId: userId || "",
        emailAddress: email,
        role: "org:member",
    });

    revalidatePath(`{/tenants/${orgSlug}/admin/pos}`);
    return {
        message: JSON.stringify([
            { message: "Staff invite sent.", result: "success" },
        ]),
    };;
}