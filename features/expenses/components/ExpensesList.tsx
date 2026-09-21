"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/utils/Spinner";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { getExpensesAction } from "../actions/expenseActions";
import { expenseCategoryLabel, type ExpenseRow } from "../types/expenseTypes";

function money(value: number) {
  return `₱${value.toFixed(2)}`;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toDateKey(firstOfMonth), endDate: toDateKey(now) };
}

type SortKey = "userName" | "category" | "amount" | "createdAt";
type SortDir = "asc" | "desc";

const columns: Array<{ key: SortKey; label: string }> = [
  { key: "userName", label: "User" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
  { key: "createdAt", label: "Created At" },
];
const ROWS_PER_PAGE = 10;

export default function ExpensesList() {
  const { isLoaded } = useClientAuthClaims();
  // Any signed-in staff member can add/edit/delete expenses; the server
  // scopes non-admins to only their own records, so no role check is needed here.
  const canManage = isLoaded;
  const router = useRouter();

  const [{ startDate, endDate }, setRange] = useState(defaultRange);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getExpensesAction({ startDate, endDate })
      .then((result) => {
        if (!cancelled) setExpenses(result.expenses);
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
      setSortDir(key === "amount" || key === "createdAt" ? "desc" : "asc");
    }
  }

  function openExpenseEditor(expenseId: string) {
    if (!canManage) return;
    router.push(`./expense/${expenseId}/edit`);
  }

  const filteredSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? expenses.filter(
          (expense) =>
            expense.userName.toLowerCase().includes(query) ||
            expenseCategoryLabel(expense.category).toLowerCase().includes(query)
        )
      : expenses;

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      if (sortKey === "amount") {
        result = a.amount - b.amount;
      } else if (sortKey === "createdAt") {
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "category") {
        result = expenseCategoryLabel(a.category).localeCompare(expenseCategoryLabel(b.category));
      } else {
        result = a.userName.localeCompare(b.userName);
      }
      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [expenses, search, sortKey, sortDir]);

  const total = filteredSorted.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / ROWS_PER_PAGE));
  const visibleExpenses = filteredSorted.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref
        withButton={canManage}
        buttonName="Add Expense"
        href="./expense/expenseSetup"
        title="Expenses"
        description="Track and review shop expenses."
      />

      <section className="rounded-lg border border-teal-100 bg-teal-100 p-5">
        <p className="text-sm font-medium text-teal-700">Total expenses for selected range</p>
        <p className="mt-1 text-3xl font-bold text-teal-800">{money(total)}</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by user or category..."
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
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <Input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setRange((range) => ({ ...range, startDate: event.target.value }))}
            className="w-auto"
          />
          <label className="text-sm text-gray-600">To</label>
          <Input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setRange((range) => ({ ...range, endDate: event.target.value }))}
            className="w-auto"
          />
        </div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-700 bg-teal-100 p-4">Expense records</h2>
        {canManage && expenses.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">Click a row to edit or delete an expense.</p>
        )}
        {expenses.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            {loading ? "Loading expenses..." : "No expenses recorded for this date range."}
          </p>
        ) : filteredSorted.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No expenses match &quot;{search}&quot;.</p>
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
                {visibleExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => openExpenseEditor(expense.id)}
                    className={`border-b border-gray-100 last:border-0 ${
                      canManage ? "hover:bg-teal-50 cursor-pointer" : "hover:cursor-not-allowed"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-gray-800">{expense.userName}</td>
                    <td className="px-3 py-3 text-gray-600">{expenseCategoryLabel(expense.category)}</td>
                    <td className="px-3 py-3 font-medium text-teal-700">{money(expense.amount)}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {new Date(expense.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
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
