"use client";

import { useMemo, useState } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import type { SalesSummary as SalesSummaryData } from "@/features/orders/actions/getSalesSummaryAction";
import SalesCard from "@/features/orders/components/SalesCard";
import SalesSummary from "@/features/orders/components/SalesSummary";
import { Input } from "@/components/ui/input";

export default function SalesTabs({
  sales,
  summary,
}: {
  sales: CustomerSalesCard[];
  summary: SalesSummaryData;
}) {
  const [activeTab, setActiveTab] = useState<"customers" | "summary">("customers");
  const [customerSearch, setCustomerSearch] = useState("");

  const filteredSales = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter((sale) => sale.customerName.toLowerCase().includes(query));
  }, [sales, customerSearch]);

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
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

      {activeTab === "summary" ? (
        <SalesSummary summary={summary} />
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
          {sales.length === 0 ? (
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
                <SalesCard key={sale.customerId} sale={sale} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
