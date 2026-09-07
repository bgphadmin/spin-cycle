import db from "@/utils/db";

export async function acceptInvite(inviteToken: string, clerkUser: any) {
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