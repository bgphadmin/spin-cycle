"use client";

import { useState } from "react";
import type { InventoryItem } from "@/features/inventory/types/inventoryTypes";
import MachinesGrid from "./MachineGrid";

export default function TenantDashboardTabs({ inventoryItems }: { inventoryItems: InventoryItem[] }) {
  const [activeTab, setActiveTab] = useState<"machines" | "inventory">("machines");
  const totalUnits = inventoryItems.reduce((total, item) => total + item.stock, 0);
  const lowStockItems = inventoryItems.filter((item) => item.stock <= item.threshold);

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {[
          ["machines", "Machine Cards"],
          ["inventory", "Inventory Stock"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value as "machines" | "inventory")}
            className={`relative border-b-2 px-4 py-3 text-sm font-semibold ${
              activeTab === value ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-teal-600"
            }`}
          >
            <span className={value === "inventory" && lowStockItems.length > 0 ? "relative z-10 pr-5" : undefined}>
              {label}
            </span>
            {value === "inventory" && lowStockItems.length > 0 && (
              <span
                aria-label={`${lowStockItems.length} low-stock inventory product${lowStockItems.length === 1 ? "" : "s"}`}
                className="absolute right-0 top-1 z-0 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-none text-white"
              >
                {lowStockItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "machines" ? (
        <MachinesGrid />
      ) : (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-teal-100 bg-teal-100 p-5">
              <p className="text-sm font-medium text-teal-700">Inventory products</p>
              <p className="mt-1 text-3xl font-bold text-teal-800">{inventoryItems.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-orange-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Total units in stock</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{totalUnits}</p>
            </div>
            <div className={`rounded-lg border p-5 ${lowStockItems.length > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-green-50 shadow-sm"}`}>
              <p className={`text-sm font-medium ${lowStockItems.length > 0 ? "text-red-700" : "text-gray-600"}`}>Low-stock products</p>
              <p className={`mt-1 text-3xl font-bold ${lowStockItems.length > 0 ? "text-red-600" : "text-gray-800"}`}>{lowStockItems.length}</p>
            </div>
          </div>

          {inventoryItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              No inventory items registered.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {inventoryItems.map((item) => {
                const isLowStock = item.stock <= item.threshold;

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-5 shadow-sm ${isLowStock ? "border-red-200 bg-red-50" : "border-gray-200 bg-emerald-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-800">{item.name}</h2>
                        <p className="mt-1 text-xs capitalize text-gray-500">{item.type} · {item.unit}</p>
                      </div>
                      {isLowStock && <span className="animate-pulse text-xs font-bold uppercase tracking-wide text-red-600">Low stock</span>}
                    </div>
                    <p className={`mt-4 text-2xl font-bold ${isLowStock ? "animate-pulse text-red-600" : "text-teal-800"}`}>
                      {item.stock} {item.unit}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Alert threshold: {item.threshold} {item.unit}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
