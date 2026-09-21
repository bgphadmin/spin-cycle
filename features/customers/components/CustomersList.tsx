"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
const ROWS_PER_PAGE = 10;

export default function CustomersList() {
  const { isLoaded } = useClientAuthClaims();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

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
    setCurrentPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ROWS_PER_PAGE));
  const visibleCustomers = filteredSorted.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} onClick={() => isLoaded && router.push(`./customer/${customer.id}/edit`)} className={`border-b border-gray-100 last:border-0 ${isLoaded ? "cursor-pointer hover:bg-teal-50" : "cursor-not-allowed"}`}>
                    <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                    <td className="px-3 py-3 text-gray-600">{customer.phone || "—"}</td>
                    <td className="px-3 py-3 text-gray-600">{customer.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}-
                  {Math.min(currentPage * ROWS_PER_PAGE, filteredSorted.length)} of {filteredSorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
