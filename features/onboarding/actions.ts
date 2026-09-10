// features/onboarding/actions.ts
"use server"

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface InviteStaffInput {
  emailAddress: string;
  role: 'org:admin' | 'org:member'; // Clerk's default roles (admin = manager, member = cashier)
}

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function inviteStaffMember(data: InviteStaffInput): Promise<ActionResponse> {
  try {
    // 1. Get the current logged-in context (must be an owner/admin of the active shop)
    const { orgId, orgRole, userId } = await auth();

    if (!orgId || !userId) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    // Security Gate: Only allowing owners or managers to invite staff
    if (orgRole !== 'org:admin') {
      return { success: false, error: "Forbidden: Only shop admins can invite staff." };
    }

    // 2. Initialize the Clerk client to fire the official email invite
    const client = await clerkClient();

    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: data.emailAddress,
      role: data.role,
      inviterUserId: userId,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`, 
    });

    // 3. Clear cache for the settings team list view
    revalidatePath(`/admin/settings`);

    return { success: true };
    
  } catch (error: any) {
    console.error("Staff Invitation Error:", error);
    // Gracefully catch cases where the user is already invited or email format is bad
    return { 
      success: false, 
      error: error?.errors?.[0]?.message || "Failed to send staff invitation email." 
    };
  }
}