"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/utils/Spinner";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import StatusBadge from "@/components/utils/StatusBadge";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { getMachinesAction } from "@/features/machines/actions/getMachinesAction";
import type { Machine } from "../types/machineTypes";

type SortKey = "name" | "type" | "status" | "usageCount" | "location";
type SortDir = "asc" | "desc";

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "usageCount", label: "Usage Count" },
  { key: "location", label: "Location" },
];
const ROWS_PER_PAGE = 10;

export default function MachinesList() {
  const { isLoaded, orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    getMachinesAction()
      .then((result) => {
        if (!cancelled) setMachines(result.machines as Machine[]);
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
    if (sortKey === key) setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "usageCount" ? "desc" : "asc");
    }
  }

  const filteredSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? machines.filter((machine) =>
          [machine.name, machine.type, machine.status, machine.location ?? ""].some((value) =>
            value.toLowerCase().includes(query),
          ),
        )
      : machines;

    return [...filtered].sort((a, b) => {
      const result =
        sortKey === "usageCount"
          ? a.usageCount - b.usageCount
          : String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortDir === "asc" ? result : -result;
    });
  }, [machines, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ROWS_PER_PAGE));
  const visibleMachines = filteredSorted.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref
        withButton={isAdmin}
        buttonName="Add Machine"
        href="./machines/machineSetup"
        title="Machines"
        description="View and manage all registered washers and dryers."
      />
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name, type, status, or location..."
          aria-label="Search machines"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        {loading && (
          <span className="absolute right-3 top-2">
            <Spinner />
          </span>
        )}
      </div>
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="bg-teal-100 p-4 text-lg font-semibold text-teal-700">Machine records</h2>
        {machines.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            {loading ? "Loading machines..." : "No machines registered."}
          </p>
        ) : filteredSorted.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No machines match &quot;{search}&quot;.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
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
                {visibleMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    onClick={() => isAdmin && router.push(`./machines/${machine.id}/edit`)}
                    className={`border-b border-gray-100 last:border-0 ${
                      isAdmin ? "cursor-pointer hover:bg-teal-50" : "cursor-not-allowed"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-gray-800">{machine.name}</td>
                    <td className="px-3 py-3 capitalize text-gray-600">{machine.type}</td>
                    <td className="px-3 py-3 text-gray-600">
                      <StatusBadge status={machine.status} />
                    </td>
                    <td className="px-3 py-3 text-gray-600">{machine.usageCount}</td>
                    <td className="px-3 py-3 text-gray-600">{machine.location || "—"}</td>
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
