"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { updateTenantUserRoleAction } from "../actions/userActions";
import type { TenantUser } from "../types";

export default function UserRoleTable({
  tenantSlug,
  users,
}: {
  tenantSlug: string;
  users: TenantUser[];
}) {
  const [rows, setRows] = useState(users);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function changeRole(clerkId: string, role: TenantUser["role"]) {
    setError("");
    startTransition(async () => {
      try {
        await updateTenantUserRoleAction(tenantSlug, clerkId, role);
        setRows((current) => current.map((user) => user.clerkId === clerkId ? { ...user, role } : user));
        toast.success(`User role changed to ${role === "org:admin" ? "Admin" : "Member"}.`);
      } catch (actionError) {
        const message = actionError instanceof Error ? actionError.message : "Unable to update user role.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-gray-500">No users found in this organization.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-gray-200 bg-teal-50 text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th></tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.clerkId} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-5 py-4 text-gray-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Role for ${user.name}`}
                      value={user.role}
                      disabled={isPending}
                      onChange={(event) => changeRole(user.clerkId, event.target.value as TenantUser["role"])}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="org:member">Member</option>
                      <option value="org:admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
