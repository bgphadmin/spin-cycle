"use client";

import { useState } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import type { SalesSummary as SalesSummaryData } from "@/features/orders/actions/getSalesSummaryAction";
import SalesCard from "@/features/orders/components/SalesCard";
import SalesSummary from "@/features/orders/components/SalesSummary";

export default function SalesTabs({
  sales,
  summary,
}: {
  sales: CustomerSalesCard[];
  summary: SalesSummaryData;
}) {
  const [activeTab, setActiveTab] = useState<"customers" | "summary">("customers");

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
      ) : sales.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No sales recorded today.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sales.map((sale) => (
            <SalesCard key={sale.customerId} sale={sale} />
          ))}
        </div>
      )}
    </>
  );
}
