"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SuperAdminTabs from "@/features/superAdmin/components/SuperAdminTabs";
import {
  getTenantMonthlyBilling,
  type SuperAdminTenantRow,
} from "@/features/superAdmin/types";
import {
  updateMachineMonthlyRateAction,
  updateTenantMachineMonthlyRateAction,
} from "@/features/superAdmin/actions";
import toast from "react-hot-toast";

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(value));
}

function trialStatus(tenant: SuperAdminTenantRow, now: number) {
  if (tenant.subscriptionStatus !== "TRIAL") {
    return { label: tenant.subscriptionStatus, detail: "—", expired: false };
  }
  if (!tenant.trialEndsAt) {
    return { label: "TRIAL", detail: "Expiry not set", expired: false };
  }

  const expiry = new Date(tenant.trialEndsAt).getTime();
  const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
  if (expiry <= now) {
    return { label: "TRIAL — EXPIRED", detail: `Expired ${formatDate(tenant.trialEndsAt)}`, expired: true };
  }
  if (daysLeft <= 1) {
    return { label: "TRIAL — EXPIRES WITHIN 24 HOURS", detail: formatDate(tenant.trialEndsAt), expired: false };
  }
  return {
    label: "TRIAL",
    detail: `${formatDate(tenant.trialEndsAt)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`,
    expired: false,
  };
}

const statusStyles: Record<SuperAdminTenantRow["subscriptionStatus"], string> = {
  REGULAR: "bg-blue-100 text-blue-800",
  PREMIUM: "bg-purple-100 text-purple-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  TRIAL: "bg-amber-100 text-amber-900",
};

export default function SuperAdminDashboard({
  tenants,
  machineMonthlyRate: initialMachineMonthlyRate,
}: {
  tenants: SuperAdminTenantRow[];
  machineMonthlyRate: number;
}) {
  const [tenantRows, setTenantRows] = useState(tenants);
  const [search, setSearch] = useState("");
  const [machineMonthlyRate, setMachineMonthlyRate] = useState(initialMachineMonthlyRate);
  const [rateInput, setRateInput] = useState(String(initialMachineMonthlyRate));
  const [savingRate, startSavingRate] = useTransition();
  const now = Date.now();

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenantRows;
    return tenantRows.filter((tenant) =>
      [tenant.shopName, tenant.contactPerson, tenant.email, tenant.phone, tenant.subscriptionStatus]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [tenantRows, search]);

  const totalMachines = tenantRows.reduce((total, tenant) => total + tenant.machineCount, 0);
  const monthlyBilling = tenantRows.reduce(
    (total, tenant) => total + getTenantMonthlyBilling(tenant, machineMonthlyRate),
    0,
  );
  const expiredTrials = tenantRows.filter((tenant) => trialStatus(tenant, now).expired).length;
  const trialsExpiringSoon = tenantRows.filter((tenant) => {
    if (tenant.subscriptionStatus !== "TRIAL" || !tenant.trialEndsAt) return false;
    const daysLeft = (new Date(tenant.trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  const handleRateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSavingRate(async () => {
      try {
        const savedRate = await updateMachineMonthlyRateAction(rateInput);
        setMachineMonthlyRate(savedRate);
        setRateInput(String(savedRate));
        toast.success("Machine rate updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the machine rate.");
      }
    });
  };

  const handleTenantRateSave = async (tenantId: string, rateValue: string) => {
    const savedRate = await updateTenantMachineMonthlyRateAction(tenantId, rateValue);
    setTenantRows((currentRows) =>
      currentRows.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, machineMonthlyRate: savedRate } : tenant,
      ),
    );
    return savedRate;
  };

  return (
    <main className="mx-auto mb-24 mt-8 w-full max-w-7xl space-y-6 px-4 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold text-teal-800">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tenant subscriptions, trial expirations, machine counts, and monthly billing.
        </p>
      </header>

      <SuperAdminTabs activeTab="dashboard" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tenants" value={String(tenants.length)} />
        <SummaryCard label="Machines" value={String(totalMachines)} />
        <SummaryCard label="Estimated monthly billing" value={money(monthlyBilling)} />
        <SummaryCard
          label="Trials expiring in 7 days"
          value={`${trialsExpiringSoon} expiring · ${expiredTrials} expired`}
        />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-teal-800">Billing report</h2>
            <p className="text-sm text-gray-600">
              The default rate is {money(machineMonthlyRate)} per machine per month. Tenant-specific rates override this default.
              REGULAR and PREMIUM tenants are billed; other statuses are not.
              Expired trials remain TRIAL and do not lose access.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <form
              onSubmit={handleRateSubmit}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Rate per machine (PHP/month)
                <Input
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  required
                  value={rateInput}
                  onChange={(event) => setRateInput(event.target.value)}
                  className="w-auto"
                />
              </label>
              <Button type="submit" variant="standard" disabled={savingRate}>
                {savingRate ? "Saving..." : "Save rate"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-teal-800">All tenants</h2>
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenant, contact, or status..."
            aria-label="Search tenants"
            className="sm:max-w-sm"
          />
        </div>
        {filteredTenants.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {            tenantRows.length === 0 ? "No tenants registered." : "No tenants match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-teal-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-3 py-3">Tenant</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Subscription</th>
                  <th className="px-3 py-3">Trial expiration</th>
                  <th className="px-3 py-3 text-right">Machines</th>
                  <th className="px-3 py-3 text-right">Rate / machine</th>
                  <th className="px-3 py-3 text-right">Monthly billing</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => {
                  const status = trialStatus(tenant, now);
                  const billing = getTenantMonthlyBilling(tenant, machineMonthlyRate);
                  return (
                    <tr key={tenant.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900">{tenant.shopName}</p>
                        <p className="text-xs text-gray-500">Created {formatDate(tenant.createdAt)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{tenant.contactPerson}</p>
                        <p className="text-xs text-gray-500">{tenant.email}</p>
                        <p className="text-xs text-gray-500">{tenant.phone}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[tenant.subscriptionStatus]}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className={`px-3 py-3 ${status.expired ? "font-medium text-red-700" : "text-gray-600"}`}>
                        {status.detail}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{tenant.machineCount}</td>
                      <td className="px-3 py-3 text-right text-gray-600">
                        <TenantRateEditor
                          tenant={tenant}
                          globalRate={machineMonthlyRate}
                          onSave={(rateValue) => handleTenantRateSave(tenant.id, rateValue)}
                        />
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-teal-800">{money(billing)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <tr>
                  <td className="px-3 py-3" colSpan={4}>Filtered tenant totals</td>
                  <td className="px-3 py-3 text-right">
                    {filteredTenants.reduce((total, tenant) => total + tenant.machineCount, 0)}
                  </td>
                  <td />
                  <td className="px-3 py-3 text-right text-teal-800">
                    {money(filteredTenants.reduce(
                      (total, tenant) =>
                        total + getTenantMonthlyBilling(tenant, machineMonthlyRate),
                      0,
                    ))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-teal-800">{value}</p>
    </section>
  );
}

function TenantRateEditor({
  tenant,
  globalRate,
  onSave,
}: {
  tenant: SuperAdminTenantRow;
  globalRate: number;
  onSave: (rateValue: string) => Promise<number | null>;
}) {
  const [rateInput, setRateInput] = useState(
    tenant.machineMonthlyRate === null ? "" : tenant.machineMonthlyRate.toFixed(2),
  );
  const [saving, startSaving] = useTransition();
  const effectiveRate = tenant.machineMonthlyRate ?? globalRate;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSaving(async () => {
      try {
        const savedRate = await onSave(rateInput);
        setRateInput(savedRate === null ? "" : savedRate.toFixed(2));
        toast.success(
          savedRate === null
            ? "Tenant now uses the global machine rate."
            : "Tenant machine rate updated.",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update this tenant's rate.");
      }
    });
  };

  return (
    <div className="min-w-44 space-y-1">
      <p className="text-xs text-gray-500">
        {tenant.machineMonthlyRate === null ? "Global rate" : "Custom rate"}: {money(effectiveRate)}
      </p>
      <form onSubmit={handleSubmit} className="flex items-center justify-end gap-1">
        <Input
          type="number"
          min="0"
          max="99999999.99"
          step="0.01"
          aria-label={`Custom rate per machine for ${tenant.shopName}; leave blank to use global rate`}
          placeholder={globalRate.toFixed(2)}
          value={rateInput}
          onChange={(event) => setRateInput(event.target.value)}
          className="h-8 w-28 bg-white text-right"
        />
        <Button type="submit" size="sm" variant="standard_sm" disabled={saving}>
          {saving ? "..." : "Save"}
        </Button>
      </form>
      <p className="text-xs text-gray-500">Leave blank to use global rate.</p>
    </div>
  );
}
