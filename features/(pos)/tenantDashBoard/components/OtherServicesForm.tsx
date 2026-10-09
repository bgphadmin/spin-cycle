"use client";

import { useEffect, useMemo, useState } from "react";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import CustomerInput from "@/components/utils/CustomerInput";
import {
  getCustomersAction,
  getServicesAction,
  type Customer,
} from "@/features/orders/actions/getData";
import { createOtherServiceSaleAction } from "../actions/createOtherServiceSaleAction";
import OtherServicesGrid from "./OtherServicesGrid";
import DiscountFields from "@/features/orders/components/DiscountFields";
import type { DiscountType } from "@/features/orders/utils/discount";
import { calculateDiscountAmount } from "@/features/orders/utils/discount";

type DateRange = { startDate: string; endDate: string; timeZone: string };

type OtherService = {
  id: string;
  name: string;
  price: number;
  pricingUnit: string | null;
  type: "WASH" | "DRY" | "OTHERS" | "FOLDS";
};

export default function OtherServicesForm({ initialRange }: { initialRange: DateRange }) {
  const [services, setServices] = useState<OtherService[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paid, setPaid] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("FIXED_AMOUNT");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountNote, setDiscountNote] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [allServices, allCustomers] = await Promise.all([
          getServicesAction(),
          getCustomersAction(),
        ]);
        if (cancelled) return;
        setServices(allServices.filter((service) => service.type === "OTHERS"));
        setCustomers(allCustomers);
      } catch (error) {
        if (!cancelled) {
          setDataError(
            error instanceof Error ? error.message : "Unable to load services and customers.",
          );
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const subtotal = useMemo(() => {
    const count = Number(quantity);
    return selectedService && Number.isSafeInteger(count) && count > 0
      ? selectedService.price * count
      : null;
  }, [quantity, selectedService]);
  const numericDiscount = Number(discountValue);
  const isDiscountValid = !discountApplied ||
    subtotal !== null &&
    Number.isFinite(numericDiscount) &&
    numericDiscount >= 0 &&
    (discountType === "FIXED_AMOUNT"
      ? numericDiscount <= subtotal
      : numericDiscount <= 100);
  const discountAmount = !discountApplied
    ? 0
    : isDiscountValid && subtotal !== null
    ? calculateDiscountAmount(subtotal, discountType, numericDiscount)
    : null;
  const total = subtotal !== null && discountAmount !== null
    ? subtotal - discountAmount
    : subtotal;

  function resetForm() {
    setFormVersion((version) => version + 1);
    setRefreshKey((version) => version + 1);
    setSelectedServiceId("");
    setQuantity("1");
    setPaymentMethod("");
    setPaid(false);
    setDiscountApplied(false);
    setDiscountType("FIXED_AMOUNT");
    setDiscountValue("0");
    setDiscountNote("");
  }

  function handleSaleAdded() {
    resetForm();
    setIsAddSaleOpen(false);
  }

  return (
    <>
      <OtherServicesGrid
        initialRange={initialRange}
        services={services}
        customers={customers}
        refreshKey={refreshKey}
        loadingServices={loadingData}
        onAddSale={() => setIsAddSaleOpen(true)}
      />
      {isAddSaleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddSaleOpen(false);
          }}
        >
          <section className="my-3 w-full max-w-3xl rounded-lg bg-white p-5 shadow-2xl sm:my-0 sm:p-8" style={{ marginTop: "200px" }}>
            {loadingData ? (
              <p role="status" className="py-8 text-center text-sm text-gray-500">
                Loading Other Services and customers...
              </p>
            ) : dataError ? (
              <p role="alert" className="py-4 text-sm text-red-600">{dataError}</p>
            ) : services.length === 0 ? (
              <div className="space-y-2 py-4">
                <h2 className="text-lg font-semibold text-teal-800">Record an Other Service sale</h2>
                <p className="text-sm text-gray-600">
                  No services with the OTHERS type are configured. Add one in Services before recording a sale.
                </p>
              </div>
            ) : (
              <FormContainer
                key={formVersion}
                action={createOtherServiceSaleAction}
                onSuccess={handleSaleAdded}
              >
                {({ loading }) => (
                  <div className="space-y-5">
                    <StandardHeader2
                      withButton
                      buttonName="Record Sale"
                      title="Add Other Service Sale"
                      description="Record a customer sale for a configured Other Service."
                      loading={loading}
                      onCancel={() => setIsAddSaleOpen(false)}
                    />
                    <div className="space-y-4">
                      <CustomerInput name="customerName" defaultValue="" customers={customers} required />
                      <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        Other Service
                        <select
                          name="serviceId"
                          value={selectedServiceId}
                          onChange={(event) => setSelectedServiceId(event.target.value)}
                          required
                          disabled={loading}
                          className="h-12 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        >
                          <option value="" disabled>Select a service</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} — ₱{service.price.toFixed(2)}
                              {service.pricingUnit ? ` ${service.pricingUnit}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedService && (
                        <p className="text-sm text-gray-500">
                          Price: ₱{selectedService.price.toFixed(2)}
                          {selectedService.pricingUnit ? ` ${selectedService.pricingUnit}` : ""}
                        </p>
                      )}
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
                            className="h-12 rounded-md border border-gray-300 px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                          Order Type
                          <select
                            name="orderType"
                            defaultValue="WALK_IN"
                            disabled={loading}
                            className="h-12 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          >
                            <option value="WALK_IN">Walk-in</option>
                            <option value="DELIVERY">Delivery</option>
                          </select>
                        </label>
                      </div>
                      <DiscountFields
                        applied={discountApplied}
                        type={discountType}
                        value={discountValue}
                        note={discountNote}
                        onAppliedChange={setDiscountApplied}
                        onTypeChange={setDiscountType}
                        onValueChange={setDiscountValue}
                        onNoteChange={setDiscountNote}
                        disabled={loading}
                      />
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
                            checked={paid}
                            onChange={(event) => setPaid(event.target.checked)}
                            disabled={loading}
                          />
                          Paid
                        </label>
                      </fieldset>
                      <div className="rounded-md bg-teal-50 p-4 text-right">
                        <p className="text-sm text-gray-600">
                          Subtotal: {subtotal === null ? "—" : `₱${subtotal.toFixed(2)}`}
                        </p>
                        {discountApplied && (
                          <p className="text-sm text-gray-600">
                            Discount: {discountAmount === null ? "—" : `₱${discountAmount.toFixed(2)}`}
                          </p>
                        )}
                        <p className="mt-1 text-lg font-bold text-teal-800">
                          Amount due: {total === null || discountAmount === null ? "—" : `₱${total.toFixed(2)}`}
                        </p>
                      </div>
                      <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                        Notes (optional)
                        <textarea
                          name="comment"
                          maxLength={500}
                          rows={3}
                          disabled={loading}
                          className="rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </FormContainer>
            )}
          </section>
        </div>
      )}
    </>
  );
}
