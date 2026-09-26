"use client";

import { useEffect, useState } from "react";
import CustomerInput from "@/components/utils/CustomerInput";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import {
  getAdminOrderEditDataAction,
  updateAdminOrderAction,
  type AdminOrderEditData,
} from "@/features/orders/actions/adminOrderActions";

export default function AdminOrderEditModal({
  orderId,
  onClose,
  onSuccess,
}: {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [data, setData] = useState<AdminOrderEditData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [machineId, setMachineId] = useState("");
  const [baseServiceId, setBaseServiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderType, setOrderType] = useState("WALK_IN");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAdminOrderEditDataAction(orderId).then((result) => {
      if (cancelled) return;
      setData(result);
      if (result) {
        setMachineId(result.order.machineId);
        setBaseServiceId(result.order.baseServiceId);
        setPaymentMethod(result.order.paymentMethod);
        setOrderType(result.order.orderType);
        setPaid(result.order.paid);
      }
      setLoadingData(false);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const selectedMachine = data?.machines.find((machine) => machine.id === machineId);
  const baseType = selectedMachine?.type === "washer" ? "WASH" : "DRY";
  const baseServices = data?.services.filter(
    (service) => String(service.type).toUpperCase() === baseType,
  ) ?? [];
  const extraServices = data?.services.filter(
    (service) =>
      String(service.type).toUpperCase() === "OTHERS" ||
      (selectedMachine?.type === "dryer" && String(service.type).toUpperCase() === "FOLDS"),
  ) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4" onClick={(event) => event.stopPropagation()}>
      <div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        {loadingData ? <p className="p-8 text-center text-sm text-gray-500">Loading order...</p> : !data ? (
          <p className="p-8 text-center text-sm text-red-600">Order could not be loaded.</p>
        ) : (
          <FormContainer action={updateAdminOrderAction} onSuccess={onSuccess}>
            {({ loading }) => (
              <div className="space-y-1">
                <div className="mb-4 min-w-0 flex-1">
                  <StandardHeader2
                    title="Edit Order"
                    description={`Machine: ${data.order.machineName} · Status: ${data.order.status.replace("_", " ")}`}
                    withButton
                    buttonName="Update"
                    loading={loading}
                    onCancel={onClose}
                  />
                </div>
                <input type="hidden" name="orderId" value={data.order.id} />
                <CustomerInput name="customerName" defaultValue={data.order.customerName} customers={data.customers} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium">
                    Machine
                    <select name="machineId" value={machineId} onChange={(event) => setMachineId(event.target.value)} required className="rounded-md border border-gray-300 bg-white px-3 py-2">
                      {data.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name} ({machine.type}, {machine.status.toLowerCase()})</option>)}
                    </select>
                  </label>
                  <fieldset className="relative rounded-md border border-gray-200 p-2">
                    <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">Order Type</legend>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                      {["WALK_IN", "DELIVERY"].map((value) => (
                        <label key={value}><input type="radio" name="orderType" value={value} checked={orderType === value} onChange={() => setOrderType(value)} /> {value === "WALK_IN" ? "Walk-in" : "Delivery"}</label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <fieldset className="relative mt-6 rounded-md border border-gray-200 p-2">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">Base Service</legend>
                  <div className="mt-2 flex flex-col gap-2">
                    {baseServices.map((service) => <label key={service.id}><input type="radio" name="baseServiceId" value={service.id} checked={baseServiceId === service.id} onChange={() => setBaseServiceId(service.id)} required /> {service.name} (₱{service.price.toFixed(2)})</label>)}
                  </div>
                </fieldset>
                <fieldset className="relative mt-6 rounded-md border border-gray-200 p-2">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">Additional Services</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {extraServices.map((service) => <label key={service.id}><input type="checkbox" name="extraServices" value={service.id} defaultChecked={data.order.extraServiceIds.includes(service.id)} /> {service.name} (₱{service.price.toFixed(2)})</label>)}
                  </div>
                </fieldset>
                <fieldset className="relative mt-6 rounded-md border border-gray-200 p-2">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">Inventory Items</legend>
                  <div className="mt-2 flex flex-col gap-2">
                    {data.inventoryItems.map((item) => {
                      const previous = data.order.inventoryQuantities[item.id] ?? 0;
                      return <label key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-2 text-sm">
                        <span>{item.name} ({item.unit}) — ₱{item.price.toFixed(2)} <span className="ml-1 text-xs text-gray-500">({item.stock + previous} available)</span></span>
                        <input type="number" name={`inventory_${item.id}`} min={0} max={item.stock + previous} step={1} defaultValue={previous} className="w-20 rounded-md border border-gray-300 p-1 text-center" />
                      </label>;
                    })}
                  </div>
                </fieldset>
                <fieldset className="relative mt-6 rounded-md border border-gray-200 p-2">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">Payment Method</legend>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {["CASH", "CARD", "EWALLET"].map((value) => <label key={value}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} required /> {value === "EWALLET" ? "E-wallet" : value[0] + value.slice(1).toLowerCase()}</label>)}
                  </div>
                  <div className="mt-4">
                    <label><input type="checkbox" name="paid" checked={paid} onChange={(event) => setPaid(event.target.checked)} /> Paid</label>
                  </div>
                </fieldset>
                <div className="mt-4">
                  <label>
                    Comment:
                    <textarea name="comment" defaultValue={data.order.comment} className="w-full rounded-md border border-gray-300 p-1" />
                  </label>
                </div>
              </div>
            )}
          </FormContainer>
        )}
      </div>
    </div>
  );
}
