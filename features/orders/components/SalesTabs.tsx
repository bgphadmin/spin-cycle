"use client";

import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import type {
  SalesSummary as SalesSummaryData,
  SalesSummaryUser,
} from "@/features/orders/actions/getSalesSummaryAction";
import { getTodaySalesAction } from "@/features/orders/actions/getSalesAction";
import { getSalesSummaryAction } from "@/features/orders/actions/getSalesSummaryAction";
import SalesCard from "@/features/orders/components/SalesCard";
import SalesSummary from "@/features/orders/components/SalesSummary";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";

function SalesCardSkeleton() {
  return (
    <article className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" aria-hidden="true">
      <div className="flex items-start justify-between gap-3 bg-teal-100 p-5">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded bg-teal-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-3 w-12 rounded bg-gray-200" />
          <div className="ml-auto h-6 w-24 rounded bg-teal-200" />
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 px-5 pb-5 pt-3">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-6 w-16 rounded-full bg-teal-200" />
      </div>
    </article>
  );
}

export default function SalesTabs({
  sales,
  summary,
  summaryUsers,
}: {
  sales: CustomerSalesCard[];
  summary: SalesSummaryData;
  summaryUsers: SalesSummaryUser[];
}) {
  const { orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const [activeTab, setActiveTab] = useState<"customers" | "summary">("customers");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [summaryStartDate, setSummaryStartDate] = useState(summary.startDate);
  const [summaryEndDate, setSummaryEndDate] = useState(summary.endDate);
  const [summaryUserId, setSummaryUserId] = useState("all");
  const [appliedSummaryUserId, setAppliedSummaryUserId] = useState("all");
  const [summaryFilterError, setSummaryFilterError] = useState("");
  const [currentSales, setCurrentSales] = useState(sales);
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [isPending, startTransition] = useTransition();

  function handleDateChange(dateKey: string) {
    setSelectedDate(dateKey);
    setSummaryFilterError("");
    startTransition(async () => {
      const nextSales = await getTodaySalesAction(dateKey || undefined);
      setCurrentSales(nextSales);
      setCustomerSearch("");
    });
  }

  async function refreshSummary(paid: boolean, customerId: string) {
    setCurrentSales((sales) =>
      sales.map((sale) => (sale.customerId === customerId ? { ...sale, isPaid: paid } : sale)),
    );
    try {
      const nextSummary = await getSalesSummaryAction({
        startDate: currentSummary.startDate,
        endDate: currentSummary.endDate,
        userId: appliedSummaryUserId,
      });
      setCurrentSummary(nextSummary);
    } catch (error) {
      setSummaryFilterError(error instanceof Error ? error.message : "Unable to refresh the sales summary.");
    }
  }

  function applySummaryFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummaryFilterError("");
    startTransition(async () => {
      try {
        const nextSummary = await getSalesSummaryAction({
          startDate: summaryStartDate,
          endDate: summaryEndDate,
          userId: summaryUserId,
        });
        setSummaryStartDate(nextSummary.startDate);
        setSummaryEndDate(nextSummary.endDate);
        setAppliedSummaryUserId(summaryUserId);
        setCurrentSummary(nextSummary);
      } catch (error) {
        setSummaryFilterError(error instanceof Error ? error.message : "Unable to apply the summary filters.");
      }
    });
  }

  function clearSummaryFilters() {
    setSummaryFilterError("");
    startTransition(async () => {
      try {
        const nextSummary = await getSalesSummaryAction();
        setSummaryStartDate(nextSummary.startDate);
        setSummaryEndDate(nextSummary.endDate);
        setSummaryUserId("all");
        setAppliedSummaryUserId("all");
        setCurrentSummary(nextSummary);
      } catch (error) {
        setSummaryFilterError(error instanceof Error ? error.message : "Unable to reset the summary filters.");
      }
    });
  }

  const filteredSales = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return currentSales;
    return currentSales.filter((sale) => sale.customerName.toLowerCase().includes(query));
  }, [currentSales, customerSearch]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-0">
        <div className="flex min-w-0 gap-1 sm:gap-2">
          {[
            ["customers", "Customer Sales"],
            ["summary", "Sales Summary"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as "customers" | "summary")}
              className={`flex-1 whitespace-nowrap border-b-2 px-2 py-3 text-xs font-semibold sm:flex-none sm:px-4 sm:text-sm ${activeTab === value ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-teal-600"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
        {isAdmin && activeTab === "customers" && (
          <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:mb-2 sm:w-auto" role="group" aria-labelledby="sales-date-label">
            <label id="sales-date-label" htmlFor="sales-date" className="whitespace-nowrap text-sm font-medium text-gray-600">
              Sales date
            </label>
            <Input
              id="sales-date"
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              disabled={isPending}
              aria-label="Filter sales by date"
              className="min-w-0 w-full sm:w-auto"
            />
            {isPending && (
              <span className="sr-only" role="status" aria-live="polite">
                Loading sales data
              </span>
            )}
          </div>
        )}
      </div>

      {activeTab === "summary" ? (
        <div className="space-y-5">
          {isAdmin && (
            <form
              onSubmit={applySummaryFilters}
              className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto_auto] lg:items-end"
            >
              <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-600">
                From date
                <Input
                  type="date"
                  value={summaryStartDate}
                  max={summaryEndDate}
                  onChange={(event) => setSummaryStartDate(event.target.value)}
                  disabled={isPending}
                  aria-label="Sales summary start date"
                  required
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-600">
                To date
                <Input
                  type="date"
                  value={summaryEndDate}
                  min={summaryStartDate}
                  onChange={(event) => setSummaryEndDate(event.target.value)}
                  disabled={isPending}
                  aria-label="Sales summary end date"
                  required
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-gray-600">
                Filter by user
                <Select
                  value={summaryUserId}
                  onValueChange={setSummaryUserId}
                  disabled={isPending}
                >
                  <SelectTrigger
                    className="w-full bg-white"
                    aria-label="Filter sales summary by user"
                  >
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All users</SelectItem>
                    {summaryUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearSummaryFilters}
                disabled={isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
            </form>
          )}
          {summaryFilterError && (
            <p role="alert" className="text-sm text-red-600">
              {summaryFilterError}
            </p>
          )}
          {isPending && (
            <p role="status" aria-live="polite" className="text-sm text-gray-500">
              Updating sales summary...
            </p>
          )}
          <SalesSummary summary={currentSummary} />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by customer name..."
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              className="max-w-sm"
            />
          </div>
          {isPending ? (
            <div className="grid gap-5 md:grid-cols-2" aria-label="Loading customer sales">
              {Array.from({ length: 4 }, (_, index) => (
                <SalesCardSkeleton key={index} />
              ))}
            </div>
          ) : currentSales.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              No sales recorded today.
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              No customers match &quot;{customerSearch}&quot;.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredSales.map((sale) => (
                <SalesCard
                  key={sale.customerId}
                  sale={sale}
                  onPaymentStatusChange={(paid) => refreshSummary(paid, sale.customerId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
