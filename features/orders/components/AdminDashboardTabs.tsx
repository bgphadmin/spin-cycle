"use client";

import { useState } from "react";
import AdminFinancialSummary from "@/features/orders/components/AdminFinancialSummary";
import AdminSalesAnalytics from "@/features/orders/components/AdminSalesAnalytics";
import AdminOrderManagement from "@/features/orders/components/AdminOrderManagement";
import type { AdminSalesAnalytics as AdminSalesAnalyticsData } from "@/features/orders/actions/getAdminSalesAnalyticsAction";
import type { AdminOrderRow } from "@/features/orders/actions/adminOrderActions";

export default function AdminDashboardTabs({
  analytics,
  orders,
}: {
  analytics: AdminSalesAnalyticsData;
  orders: AdminOrderRow[];
}) {
  const [activeTab, setActiveTab] = useState<"analytics" | "orders">("analytics");

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === "analytics" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-teal-600"
          }`}
        >
          Chart Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${
            activeTab === "orders" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-teal-600"
          }`}
        >
          Order Management
        </button>
      </div>
      {activeTab === "analytics" ? (
        <>
          <AdminFinancialSummary analytics={analytics} />
          <AdminSalesAnalytics analytics={analytics} />
        </>
      ) : (
        <AdminOrderManagement orders={orders} />
      )}
    </>
  );
}
