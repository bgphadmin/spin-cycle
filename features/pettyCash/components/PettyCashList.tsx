"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/utils/Spinner";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { getPettyCashAction } from "@/features/pettyCash/actions/pettyCashActions";
import type { PettyCashRow } from "@/features/pettyCash/types/pettyCashTypes";

function money(value: number) {
  return `₱${value.toFixed(2)}`;
}

type SortKey = "userName" | "name" | "amount" | "cashDate";
type SortDir = "asc" | "desc";

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "userName", label: "User" },
  { key: "name", label: "Name" },
  { key: "amount", label: "Amount" },
  { key: "cashDate", label: "Date" },
];
const ROWS_PER_PAGE = 10;

export default function PettyCashList({
  initialRange,
}: {
  initialRange: { startDate: string; endDate: string; timeZone: string };
}) {
  const { isLoaded, orgRole } = useClientAuthClaims();
  const isAdmin = isLoaded && orgRole === "org:admin";
  const canManage = isLoaded;
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const basePath = `/tenants/${tenantSlug}/tenantDashboard/pettyCash`;
  const [{ startDate, endDate }, setRange] = useState({
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
  });
  const [entries, setEntries] = useState<PettyCashRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cashDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPettyCashAction({ startDate, endDate })
      .then((result) => {
        if (!cancelled) {
          setEntries(result.entries);
          setTotalAmount(result.totalAmount);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load petty cash records.");
          setEntries([]);
          setTotalAmount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  function toggleSort(key: SortKey) {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "amount" || key === "cashDate" ? "desc" : "asc");
    }
  }

  const filteredSorted = useMemo(() => {
    const userQuery = isAdmin ? userSearch.trim().toLowerCase() : "";
    const nameQuery = nameSearch.trim().toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        (!userQuery || entry.userName.toLowerCase().includes(userQuery)) &&
        (!nameQuery || entry.name.toLowerCase().includes(nameQuery)),
    );

    return [...filtered].sort((a, b) => {
      let result = 0;
      if (sortKey === "amount") {
        result = a.amount - b.amount;
      } else if (sortKey === "cashDate") {
        result = a.cashDate.localeCompare(b.cashDate) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "name") {
        result = a.name.localeCompare(b.name);
      } else {
        result = a.userName.localeCompare(b.userName);
      }
      return sortDir === "asc" ? result : -result;
    });
  }, [entries, isAdmin, userSearch, nameSearch, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ROWS_PER_PAGE));
  const visibleEntries = filteredSorted.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, nameSearch, startDate, endDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref
        withButton={canManage}
        buttonName="Add Petty Cash"
        href={`${basePath}/pettyCashSetup`}
        title="Petty Cash"
        description="Track and review petty cash spending."
      />

      <section className="rounded-lg border border-teal-100 bg-teal-100 p-5">
        <p className="text-sm font-medium text-teal-700">Total Petty Cash</p>
        <p className="mt-1 text-3xl font-bold text-teal-800">{money(totalAmount)}</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          {isAdmin && (
            <Input
              type="text"
              placeholder="Search by user..."
              aria-label="Search petty cash by user"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              className="max-w-sm"
            />
          )}
          <Input
            type="text"
            placeholder="Search by name..."
            aria-label="Search petty cash by name"
            value={nameSearch}
            onChange={(event) => setNameSearch(event.target.value)}
            className="max-w-sm"
          />
          {loading && <span className="self-center"><Spinner /></span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            max={endDate}
            aria-label="Petty cash from date"
            onChange={(event) => setRange((range) => ({ ...range, startDate: event.target.value }))}
            className="w-auto"
          />
          <Input
            type="date"
            value={endDate}
            min={startDate}
            aria-label="Petty cash to date"
            onChange={(event) => setRange((range) => ({ ...range, endDate: event.target.value }))}
            className="w-auto"
          />
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="bg-teal-100 p-4 text-lg font-semibold text-teal-700">Petty cash records</h2>
        {canManage && entries.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">Click a row to edit or delete a petty cash entry.</p>
        )}
        {entries.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            {loading ? "Loading petty cash records..." : "No petty cash recorded for this date range."}
          </p>
        ) : filteredSorted.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No petty cash records match the selected filters.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="flex items-center gap-1 font-semibold uppercase tracking-wide text-gray-500 hover:text-teal-700"
                      >
                        {column.label}
                        <span className="text-teal-600">
                          {sortKey === column.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => {
                      if (canManage) router.push(`${basePath}/${entry.id}/edit`);
                    }}
                    className={`border-b border-gray-100 last:border-0 ${
                      canManage ? "cursor-pointer hover:bg-teal-50" : "hover:cursor-not-allowed"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-gray-800">{entry.userName}</td>
                    <td className="px-3 py-3 text-gray-600">{entry.name}</td>
                    <td className="px-3 py-3 font-medium text-teal-700">{money(entry.amount)}</td>
                    <td className="px-3 py-3 text-gray-600">{entry.cashDateLabel}</td>
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
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
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
