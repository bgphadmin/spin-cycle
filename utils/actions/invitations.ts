'use server';

import db from "@/utils/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { renderError } from "../error";


/**
 * Creates Invite for Staff Members
 * @param tenantId 
 * @param staffName 
 * @param email 
 * @param role 
 * @returns 
 */

export async function createInviteAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ message: string }> {

try {
  
  
  const { userId } = auth();
  if (!userId) throw new Error("Not signed in");
  
  const clerkUser = await clerkClient.users.getUser(userId);
  const tenantId = clerkUser.publicMetadata.tenantId as string;
  const staffName = String(formData.get("staffName") ?? "");
  const staffEmail = String(formData.get("email") ?? "");
  const role = "STAFF";

  if (!tenantId || !staffName || !staffEmail || !role) {
    throw new Error("Missing invitation fields");
  }
  
  const invite = await db.invitation.create({
    data: {
      tenantId,
      name: staffName,
      email: staffEmail,
      role,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h expiry
      status: "PENDING",
    },
  });
  
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?inviteToken=${invite.token}`;
  
  // return { invite, inviteLink };

      return {
      message: JSON.stringify([
        { message: "Staff invite sent successfully" },
        { result: "success" },
        { invite: invite },
      ]),
    };

  } catch (error: unknown) {
      console.error("Error sending invite:", error);
      return renderError(error);
  }
}  



export async function acceptInviteAction(inviteToken: string, clerkUser: any) {
  const invite = await db.invitation.findUnique({ where: { token: inviteToken } });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    throw new Error("Invalid or expired invite");
  }

  if (invite.email !== clerkUser.emailAddresses[0].emailAddress) {
    throw new Error("Email mismatch");
  }

  await db.user.create({
    data: {
      clerkId: clerkUser.id,
      name: invite.name,
      role: invite.role,
      tenantId: invite.tenantId,
      email: clerkUser.emailAddresses[0].emailAddress
    }
  });

  await db.invitation.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" }
  });
}


export async function expireInvitationsAction() {
  const now = new Date();

  await db.invitation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

}

// Run every hour (or daily depending on your needs)
// expireInvitationsAction().catch(console.error)