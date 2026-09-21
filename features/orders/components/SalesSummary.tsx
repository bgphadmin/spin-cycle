"use client";

import { useState } from "react";
import type { SalesSummary as SalesSummaryData } from "@/features/orders/actions/getSalesSummaryAction";

function money(value: number) {
  return `₱${value.toFixed(2)}`;
}

export default function SalesSummary({ summary }: { summary: SalesSummaryData }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-teal-100 bg-teal-100 p-5 ">
        <p className="text-sm font-medium text-teal-700">Paid total for today</p>
        <p className="mt-1 text-3xl font-bold text-teal-800">{money(summary.total)}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold bg-teal-100 p-4 text-teal-800">Today&apos;s services and items</h2>
        {summary.lines.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No paid services or items recorded today.</p>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {summary.lines.map((line) => (
              <div key={`${line.kind}-${line.name}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{line.name}</p>
                  <p className="text-xs text-gray-500">{line.kind} · {line.quantity} sold</p>
                </div>
                <span className="font-medium text-gray-700">{money(line.total)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-orange-700 bg-orange-100 p-4">Customers not paid</h2>
        {summary.unpaid.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No unpaid customer balances.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Order date</th>
                  <th className="px-3 py-3 text-right">Total owed</th>
                  <th className="px-3 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {summary.unpaid.map((row) => {
                  const isExpanded = expandedId === row.id;
                  return (
                    <tr key={row.id} className="border-b border-gray-100 align-top last:border-0">
                      <td colSpan={4} className="p-0">
                        <div className="grid grid-cols-[minmax(9rem,1fr)_minmax(7rem,1fr)_minmax(7rem,auto)_auto] items-center gap-2 px-3 py-3">
                          <span className="font-medium text-gray-800">{row.customerName}</span>
                          <span className="text-gray-600">{row.orderDate}</span>
                          <span className="text-right font-medium text-orange-700">{money(row.total)}</span>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : row.id)}
                            className="rounded border border-teal-600 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                          >
                            {isExpanded ? "Hide" : "Show"}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 px-3 py-3">
                            {row.lines.map((line) => (
                              <div key={`${row.id}-${line.kind}-${line.name}`} className="flex justify-between gap-3 py-1 text-xs text-gray-600">
                                <span>{line.name} ({line.kind}) · {line.quantity} × {money(line.total / line.quantity)}</span>
                                <span className="font-medium text-gray-700">{money(line.total)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
