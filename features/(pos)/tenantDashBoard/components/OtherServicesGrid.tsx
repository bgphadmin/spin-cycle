"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { Loader2 } from "lucide-react";
import FormContainer from "@/components/utils/FormContainer";
import CustomerInput from "@/components/utils/CustomerInput";
import Spinner from "@/components/utils/Spinner";
import toast from "react-hot-toast";
import type { Customer } from "@/features/orders/actions/getData";
import {
  deleteOtherServiceSaleAction,
  getOtherServiceSalesAction,
  updateOtherServiceSaleAction,
  type OtherServiceSaleRow,
} from "../actions/createOtherServiceSaleAction";

type OtherService = {
  id: string;
  name: string;
  price: number;
  pricingUnit: string | null;
  type: "WASH" | "DRY" | "OTHERS" | "FOLDS";
};

type DateRange = { startDate: string; endDate: string; timeZone: string };
const ROWS_PER_PAGE = 10;

function money(value: number) {
  return `₱${value.toFixed(2)}`;
}

function OtherServiceSaleEditor({
  sale,
  services,
  customers,
  onClose,
  onSaved,
  onDelete,
}: {
  sale: OtherServiceSaleRow;
  services: OtherService[];
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const [serviceId, setServiceId] = useState(sale.serviceId);
  const [quantity, setQuantity] = useState(String(sale.quantity));
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod);
  const selectedService = services.find((service) => service.id === serviceId);
  const unitPrice = serviceId === sale.serviceId ? sale.unitPrice : selectedService?.price ?? 0;
  const quantityValue = Number(quantity);
  const total = Number.isSafeInteger(quantityValue) && quantityValue > 0
    ? unitPrice * quantityValue
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-3 w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl sm:my-0 sm:p-8">
        <FormContainer action={updateOtherServiceSaleAction} onSuccess={onSaved}>
          {({ loading }) => (
            <div className="space-y-4">
              <input type="hidden" name="orderId" value={sale.id} />
              <div className="mb-6 flex flex-col gap-4 border-b border-gray-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <StandardFormTitle
                  title="Edit Other Service Sale"
                  description="Update or delete this customer sale record."
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="standard"
                    className="bg-orange-200 hover:bg-orange-300"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <DeleteButton onClick={onDelete} loading={loading} />
                  <Button type="submit" disabled={loading} variant="standard">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <CustomerInput
                  name="customerName"
                  defaultValue={sale.customerName}
                  customers={customers}
                  required
                />

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  Other Service
                  <select
                    name="serviceId"
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {money(service.price)}
                        {service.pricingUnit ? ` ${service.pricingUnit}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Quantity{selectedService?.pricingUnit ? ` (${selectedService.pricingUnit})` : ""}
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-md border border-gray-300 px-3 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Order Type
                    <select
                      name="orderType"
                      defaultValue={sale.orderType}
                      disabled={loading}
                      className="h-12 rounded-md border border-gray-300 bg-white px-3 text-sm"
                    >
                      <option value="WALK_IN">Walk-in</option>
                      <option value="DELIVERY">Delivery</option>
                    </select>
                  </label>
                </div>

                <fieldset className="rounded-md border border-gray-200 p-4">
                  <legend className="px-2 text-sm font-medium text-gray-700">Payment Method</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {[
                      ["CASH", "Cash"],
                      ["CARD", "Card"],
                      ["EWALLET", "E-Wallet"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={value}
                          checked={paymentMethod === value}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                          required
                          disabled={loading}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="paid"
                      defaultChecked={sale.paid}
                      disabled={loading}
                    />
                    Paid
                  </label>
                </fieldset>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  Notes (optional)
                  <textarea
                    name="comment"
                    defaultValue={sale.comment}
                    maxLength={500}
                    rows={3}
                    disabled={loading}
                    className="rounded-md border border-gray-300 p-3 text-sm"
                  />
                </label>
                <p className="rounded-md bg-teal-50 p-4 text-right text-lg font-bold text-teal-800">
                  Total: {total === null ? "—" : money(total)}
                </p>
              </div>
            </div>
          )}
        </FormContainer>
      </div>
    </div>
  );
}

export default function OtherServicesGrid({
  initialRange,
  services,
  customers,
  refreshKey,
  loadingServices,
  onAddSale,
}: {
  initialRange: DateRange;
  services: OtherService[];
  customers: Customer[];
  refreshKey: number;
  loadingServices: boolean;
  onAddSale: () => void;
}) {
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<OtherServiceSaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSale, setEditingSale] = useState<OtherServiceSaleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OtherServiceSaleRow | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [localRefreshKey, setLocalRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getOtherServiceSalesAction(startDate, endDate)
      .then((rows) => {
        if (!cancelled) setSales(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load Other Service sales.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, refreshKey, localRefreshKey]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter((sale) =>
      sale.customerName.toLowerCase().includes(query) ||
      sale.serviceName.toLowerCase().includes(query) ||
      "others".includes(query),
    );
  }, [sales, search]);
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ROWS_PER_PAGE));
  const visibleSales = filteredSales.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function refresh() {
    setEditingSale(null);
    setDeleteTarget(null);
    setLocalRefreshKey((key) => key + 1);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      try {
        const formData = new FormData();
        formData.set("orderId", deleteTarget.id);
        const result = await deleteOtherServiceSaleAction(null, formData);
        const messages = JSON.parse(result.message) as Array<{ message?: string; result?: string }>;
        if (messages[0]?.result !== "success") {
          throw new Error(messages[0]?.message ?? "Unable to delete Other Service sale.");
        }
        toast.success(messages[0].message ?? "Other Service sale deleted.");
        setDeleteTarget(null);
        setEditingSale(null);
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete Other Service sale.");
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="standard"
          onClick={onAddSale}
          disabled={loadingServices || services.length === 0}
        >
          Add Sale
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer or service..."
          aria-label="Search Other Service sales by customer or service"
        />
        <Input
          type="date"
          value={startDate}
          max={endDate}
          required
          onChange={(event) => setStartDate(event.target.value)}
          aria-label="Other Service sales from date"
        />
        <Input
          type="date"
          value={endDate}
          min={startDate}
          required
          onChange={(event) => setEndDate(event.target.value)}
          aria-label="Other Service sales to date"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredSales.length} of {sales.length} Other Service sales
        </p>
        {loading && <Spinner />}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="bg-teal-100 p-4 text-lg font-semibold text-teal-700">Other Service records</h2>
        {loadError ? (
          <p role="alert" className="mt-4 text-sm text-red-600">{loadError}</p>
        ) : filteredSales.length === 0 ? (
          <p className="mt-4 text-center text-sm text-gray-500">
            {loading ? "Loading Other Service records..." : "No records match these filters."}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Other Service</th>
                  <th className="px-3 py-3 text-right">Quantity</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setEditingSale(sale)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setEditingSale(sale);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit Other Service sale for ${sale.customerName}: ${sale.serviceName}`}
                    className="cursor-pointer border-b border-gray-100 align-top last:border-0 hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                  >
                    <td className="px-3 py-3 text-gray-600">{sale.createdAtLabel}</td>
                    <td className="px-3 py-3 font-medium text-gray-800">{sale.customerName}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {sale.serviceName}
                      {sale.pricingUnit ? <span className="ml-1 text-gray-500">({sale.pricingUnit})</span> : null}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">{sale.quantity}</td>
                    <td className="px-3 py-3 text-right font-medium text-teal-700">{money(sale.total)}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {sale.paid ? `Paid (${sale.paymentMethod})` : `Unpaid (${sale.paymentMethod})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}-
                  {Math.min(currentPage * ROWS_PER_PAGE, filteredSales.length)} of {filteredSales.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {editingSale && (
        <OtherServiceSaleEditor
          key={editingSale.id}
          sale={editingSale}
          services={services}
          customers={customers}
          onClose={() => setEditingSale(null)}
          onSaved={refresh}
          onDelete={() => setDeleteTarget(editingSale)}
        />
      )}
      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        loading={isDeleting}
        message={`Deleting the Other Service sale for ${deleteTarget?.customerName ?? "this customer"} cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
