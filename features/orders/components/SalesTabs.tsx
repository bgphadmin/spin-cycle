"use client";

import { useMemo, useState, useTransition } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import type { SalesSummary as SalesSummaryData } from "@/features/orders/actions/getSalesSummaryAction";
import { getTodaySalesAction } from "@/features/orders/actions/getSalesAction";
import { getSalesSummaryAction } from "@/features/orders/actions/getSalesSummaryAction";
import SalesCard from "@/features/orders/components/SalesCard";
import SalesSummary from "@/features/orders/components/SalesSummary";
import { Input } from "@/components/ui/input";
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
}: {
  sales: CustomerSalesCard[];
  summary: SalesSummaryData;
}) {
  const { orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const [activeTab, setActiveTab] = useState<"customers" | "summary">("customers");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentSales, setCurrentSales] = useState(sales);
  const [currentSummary, setCurrentSummary] = useState(summary);
  const [isPending, startTransition] = useTransition();

  function handleDateChange(dateKey: string) {
    setSelectedDate(dateKey);
    startTransition(async () => {
      const [nextSales, nextSummary] = await Promise.all([
        getTodaySalesAction(dateKey || undefined),
        getSalesSummaryAction(dateKey || undefined),
      ]);
      setCurrentSales(nextSales);
      setCurrentSummary(nextSummary);
      setCustomerSearch("");
    });
  }

  async function refreshSummary(paid: boolean, customerId: string) {
    setCurrentSales((sales) =>
      sales.map((sale) => (sale.customerId === customerId ? { ...sale, isPaid: paid } : sale)),
    );
    const nextSummary = await getSalesSummaryAction(selectedDate || undefined);
    setCurrentSummary(nextSummary);
  }

  const filteredSales = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return currentSales;
    return currentSales.filter((sale) => sale.customerName.toLowerCase().includes(query));
  }, [currentSales, customerSearch]);

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-gray-200">
        <div className="flex gap-2">
          {[
            ["customers", "Customer Sales"],
            ["summary", "Sales Summary"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as "customers" | "summary")}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                activeTab === value ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-teal-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {isAdmin && (
          <div className="mb-2 flex items-center gap-2" role="group" aria-labelledby="sales-date-label">
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
              className="w-auto"
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
        <SalesSummary summary={currentSummary} />
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
