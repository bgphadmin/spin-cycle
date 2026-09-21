"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/utils/Spinner";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { getCustomersAction } from "../actions/customerActions";
import type { CustomerRow } from "../types/customerTypes";

type SortKey = "name" | "phone" | "email";
type SortDir = "asc" | "desc";
const columns: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
];

export default function CustomersList() {
  const { isLoaded } = useClientAuthClaims();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    let cancelled = false;
    getCustomersAction()
      .then((result) => {
        if (!cancelled) setCustomers(result.customers);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? customers.filter((customer) => customer.name.toLowerCase().includes(query)) : customers;
    return [...filtered].sort((a, b) => {
      const result = (a[sortKey] ?? "").localeCompare(b[sortKey] ?? "");
      return sortDir === "asc" ? result : -result;
    });
  }, [customers, search, sortKey, sortDir]);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref withButton={isLoaded} buttonName="Add Customer" href="./customer/customerSetup" title="Customers" description="Manage your shop customers." />
      <div className="relative">
        <Input type="text" placeholder="Search by name..." value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-sm" />
        {loading && <span className="absolute right-3 top-2"><Spinner /></span>}
      </div>
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="bg-teal-100 p-4 text-lg font-semibold text-teal-700">Customer records</h2>
        {customers.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{loading ? "Loading customers..." : "No customers recorded."}</p>
        ) : filteredSorted.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No customers match &quot;{search}&quot;.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort(column.key)} className="flex items-center gap-1 font-semibold uppercase tracking-wide text-gray-500 hover:text-teal-700">
                        {column.label}
                        <span className="text-teal-600">{sortKey === column.key ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSorted.map((customer) => (
                  <tr key={customer.id} onClick={() => isLoaded && router.push(`./customer/${customer.id}/edit`)} className={`border-b border-gray-100 last:border-0 ${isLoaded ? "cursor-pointer hover:bg-teal-50" : "cursor-not-allowed"}`}>
                    <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                    <td className="px-3 py-3 text-gray-600">{customer.phone || "—"}</td>
                    <td className="px-3 py-3 text-gray-600">{customer.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
