import { auth } from '@clerk/nextjs/server';

export default async function accessTenantIdServer() {
    const { sessionClaims } = await auth();
    return sessionClaims?.tenantId;
}