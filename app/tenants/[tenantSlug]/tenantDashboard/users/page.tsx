import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getTenantUsersAction } from "@/features/users/actions/userActions";
import UserRoleTable from "@/features/users/components/UserRoleTable";

export default async function UsersPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { orgRole } = await getAuthContext();
  if (orgRole !== "org:admin") redirect("/not-allowed");

  const users = await getTenantUsersAction(params.tenantSlug);
  return (
    <main className="mx-auto mb-24 w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-800">Users</h1>
        <p className="mt-1 text-sm text-gray-500">Manage users and organization roles for this shop.</p>
      </div>
      <UserRoleTable tenantSlug={params.tenantSlug} users={users} />
    </main>
  );
}
