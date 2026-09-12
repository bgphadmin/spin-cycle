'use client';
import { useUser } from '@clerk/nextjs';

export default function accessTenantIdClient() {
  const { user } = useUser();
  return user?.publicMetadata?.tenantId;
}
