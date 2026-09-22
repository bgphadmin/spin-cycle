"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { AdminSalesAnalytics } from "../actions/getAdminSalesAnalyticsAction";

const money = (value: number) =>
  `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminFinancialSummary({ analytics }: { analytics: AdminSalesAnalytics }) {
  const [startDate, setStartDate] = useState(analytics.monthToDateRange.start);
  const [endDate, setEndDate] = useState(analytics.monthToDateRange.end);

  const totals = useMemo(() => {
    const start = startDate <= endDate ? startDate : endDate;
    const end = startDate <= endDate ? endDate : startDate;
    const selectedDays = analytics.dailyFinancials.filter(
      (point) => point.date >= start && point.date <= end,
    );

    return selectedDays.reduce(
        (result, point) => ({
          sales: result.sales + point.sales,
          expense: result.expense + Math.abs(point.expense),
          profit: result.profit + point.profit,
          days: selectedDays.length,
        }),
        { sales: 0, expense: 0, profit: 0, days: selectedDays.length },
      );
  }, [analytics.dailyFinancials, endDate, startDate]);

  return (
    <section className="mx-10 mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-teal-800">Financial summary</h2>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="financial-date-range-label">
          <span id="financial-date-range-label" className="text-sm font-medium text-gray-600">
            Date range
          </span>
          <Input
            type="date"
            aria-label="Financial summary start date"
            value={startDate}
            min={analytics.dailyFinancials[0]?.date}
            max={endDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-auto"
          />
          <span className="text-sm text-gray-500" aria-hidden="true">to</span>
          <Input
            type="date"
            aria-label="Financial summary end date"
            value={endDate}
            min={startDate}
            max={analytics.monthToDateRange.end}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-auto"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-teal-50 p-4">
          <p className="text-sm font-medium text-teal-700">Total sales</p>
          <p className="mt-1 text-2xl font-bold text-teal-800">{money(totals.sales)}</p>
        </div>
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm font-medium text-orange-700">Total expense</p>
          <p className="mt-1 text-2xl font-bold text-orange-800">{money(totals.expense)}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Total profit</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{money(totals.profit)}</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-700">Average sales per day</p>
          <p className="mt-1 text-2xl font-bold text-purple-800">
            {money(totals.days > 0 ? totals.sales / totals.days : 0)}
          </p>
        </div>
      </div>
    </section>
  );
}
