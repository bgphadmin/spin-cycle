"use client";

import { useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
  getAdminCategoryAnalyticsAction,
  type AdminSalesAnalytics,
  type AnalyticsSeries,
} from "@/features/orders/actions/getAdminSalesAnalyticsAction";

const colors = ["#0f766e", "#f97316", "#2563eb", "#9333ea", "#dc2626", "#0891b2", "#ca8a04", "#4f46e5"];
const INITIAL_WINDOW_DAYS = 30;
const money = (value: number) => `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

function chartData(series: AnalyticsSeries[]) {
  if (series.length === 0) return [];
  return series[0].data.map((point, index) => {
    const row: Record<string, string | number> = { date: point.date, label: point.label };
    for (const item of series) row[item.name] = item.data[index]?.total ?? 0;
    return row;
  });
}

function initialStartIndex(dataLength: number) {
  return Math.max(0, dataLength - INITIAL_WINDOW_DAYS);
}

function MultiSeriesChart({ title, series }: { title: string; series: AnalyticsSeries[] }) {
  const data = chartData(series);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-teal-800">{title}</h2>
      {series.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">No paid data available.</p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="18%" margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={29} angle={-35} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `₱${Number(value).toLocaleString()}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => money(Number(value ?? 0))} />
              <Legend />
              {series.map((item, index) => (
                <Bar key={item.name} dataKey={item.name} fill={colors[index % colors.length]} barSize={26} minPointSize={3} />
              ))}
              <Brush
                dataKey="label"
                height={24}
                startIndex={initialStartIndex(data.length)}
                endIndex={Math.max(0, data.length - 1)}
                travellerWidth={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function CategoryPieChart({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: Array<{ name: string; total: number }>;
  emptyMessage: string;
}) {
  if (data.length === 0 || data.every((entry) => entry.total === 0)) {
    return (
      <div>
        <h3 className="mb-4 text-base font-semibold text-teal-800">{title}</h3>
        <p className="py-12 text-center text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-teal-800">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(Number(value ?? 0))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminSalesAnalytics({ analytics }: { analytics: AdminSalesAnalytics }) {
  const [categoryStartDate, setCategoryStartDate] = useState(analytics.categoryStartDate);
  const [categoryEndDate, setCategoryEndDate] = useState(analytics.categoryEndDate);
  const [categoryTotals, setCategoryTotals] = useState(analytics.categoryTotals);
  const [expenseCategoryTotals, setExpenseCategoryTotals] = useState(analytics.expenseCategoryTotals);
  const [categoryFilterError, setCategoryFilterError] = useState("");
  const [isCategoryPending, startCategoryTransition] = useTransition();

  function applyCategoryDateRange(startDate: string, endDate: string) {
    setCategoryFilterError("");
    startCategoryTransition(async () => {
      try {
        const result = await getAdminCategoryAnalyticsAction(startDate, endDate);
        setCategoryStartDate(result.categoryStartDate);
        setCategoryEndDate(result.categoryEndDate);
        setCategoryTotals(result.categoryTotals);
        setExpenseCategoryTotals(result.expenseCategoryTotals);
      } catch (error) {
        setCategoryFilterError(
          error instanceof Error ? error.message : "Unable to load category analytics.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Daily total sales</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.dailySales} barCategoryGap="18%" margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={29} angle={-35} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `₱${Number(value).toLocaleString()}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => money(Number(value ?? 0))} />
              <Bar dataKey="total" name="Sales" fill="#0f766e" barSize={30} minPointSize={3} />
              <Brush
                dataKey="label"
                height={24}
                startIndex={initialStartIndex(analytics.dailySales.length)}
                endIndex={Math.max(0, analytics.dailySales.length - 1)}
                travellerWidth={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section> */}

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Daily sales, expenses, and profit</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={analytics.dailyFinancials}
              barCategoryGap="18%"
              margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={29} angle={-35} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `₱${Number(value).toLocaleString()}`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => money(Number(value ?? 0))} />
              <Legend />
              <ReferenceLine y={0} stroke="#6b7280" />
              <Bar dataKey="sales" name="Sales" stackId="sales" fill="#5eead4" barSize={24} />
              <Bar dataKey="expense" name="Expense" stackId="expense" fill="#fdba74" barSize={24} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Brush
                dataKey="label"
                height={24}
                startIndex={initialStartIndex(analytics.dailyFinancials.length)}
                endIndex={Math.max(0, analytics.dailyFinancials.length - 1)}
                travellerWidth={12}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <MultiSeriesChart title="Daily services" series={analytics.serviceSeries} />
      <MultiSeriesChart title="Daily inventory items" series={analytics.inventorySeries} />

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Category Analytics</h2>
        <form
          className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            applyCategoryDateRange(categoryStartDate, categoryEndDate);
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            From date
            <Input
              type="date"
              value={categoryStartDate}
              max={categoryEndDate}
              required
              disabled={isCategoryPending}
              onChange={(event) => setCategoryStartDate(event.target.value)}
              aria-label="Category analytics start date"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            To date
            <Input
              type="date"
              value={categoryEndDate}
              min={categoryStartDate}
              required
              disabled={isCategoryPending}
              onChange={(event) => setCategoryEndDate(event.target.value)}
              aria-label="Category analytics end date"
            />
          </label>
          <button
            type="submit"
            disabled={isCategoryPending}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCategoryPending ? "Loading..." : "Apply"}
          </button>
          <button
            type="button"
            disabled={isCategoryPending}
            onClick={() => applyCategoryDateRange(analytics.categoryStartDate, analytics.categoryEndDate)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset to YTD
          </button>
        </form>
        {categoryFilterError && (
          <p role="alert" className="mb-4 text-sm text-red-600">{categoryFilterError}</p>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryPieChart
            title="Sales by category"
            data={categoryTotals}
            emptyMessage="No paid sales data available for this date range."
          />
          <CategoryPieChart
            title="Expense by category"
            data={expenseCategoryTotals}
            emptyMessage="No expense data available for this date range."
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-teal-800">Top 25 customers this year</h2>
        {analytics.topCustomers.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No paid customer sales available.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topCustomers} layout="vertical" barCategoryGap="18%" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `₱${Number(value).toLocaleString()}`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => money(Number(value ?? 0))} />
                <Bar dataKey="total" name="Sales" fill="#f97316" barSize={26} minPointSize={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
