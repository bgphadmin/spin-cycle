"use client";

import { useEffect, useState } from "react";
import FormContainer from "@/components/utils/FormContainer";
import { createOrderAction } from "../../(pos)/tenantDashBoard/actions/createOrderAction";
import { getActiveOrderAction, updateOrderAction } from "../../(pos)/tenantDashBoard/actions/orderActions";
import { getCustomersAction, getInventoryAction, getServicesAction } from "@/features/orders/actions/getData";
import type { Customer } from "@/features/orders/actions/getData";
import StandardHeader3Buttons from "@/components/utils/StandardHeader3";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import CustomerInput from "@/components/utils/CustomerInput";
import OrderModalSkeleton from "@/components/utils/OrderModalSkeleton";

type OrderModalProps = {
  machineId: string;
  type: "washer" | "dryer";
  onClose: () => void;
  status: "AVAILABLE" | "IN_USE" | "UNAVAILABLE";
};

type Service = {
  id: string;
  name: string;
  price: number;
  type: "WASH" | "DRY" | "OTHERS";
};

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
};



export default function OrderModal({ machineId, type, status, onClose }: OrderModalProps) {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedOrderType, setSelectedOrderType] = useState("WALK_IN");
  const [isPaid, setIsPaid] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setActiveOrder(null);
    setSelectedPaymentMethod("");
    setSelectedOrderType("WALK_IN");
    setIsPaid(false);

    async function fetchData() {
      try {
        const [resServices, resInventory, resCustomers, resActiveOrder] = await Promise.all([
          getServicesAction(),
          getInventoryAction(),
          getCustomersAction(),
          status === "IN_USE" ? getActiveOrderAction(machineId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setServices(resServices);
        setInventoryItems(resInventory);
        setCustomers(resCustomers);
        setActiveOrder(resActiveOrder);
      } catch (error) {
        console.error("Error loading order modal data:", error);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [machineId, status]);

  const baseServiceType = type === "washer" ? "WASH" : "DRY";
  const baseServices = services.filter((service) => service.type === baseServiceType);
  const extraServices = services.filter((service) => service.type === "OTHERS");

  useEffect(() => {
    setSelectedPaymentMethod(
      String(activeOrder?.paymentMethod ?? "")
        .trim()
        .toUpperCase()
    );
  }, [activeOrder]);

  useEffect(() => {
    setSelectedOrderType(String(activeOrder?.orderType ?? "WALK_IN").toUpperCase());
  }, [activeOrder]);

  useEffect(() => {
    setIsPaid(Boolean(activeOrder?.paid));
  }, [activeOrder]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-2 sm:items-center sm:p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        {dataLoading ? (
          <OrderModalSkeleton />
        ) : (
          <FormContainer action={status === "IN_USE" ? updateOrderAction : createOrderAction} onSuccess={onClose}>
            {({ loading }) => (
              <div key={activeOrder?.id ?? "new-order"} className="space-y-1">
                <div className="min-w-0 flex-1 mb-4">
                  {status === "AVAILABLE" ?
                    <StandardHeader2
                      buttonName="Submit"
                      description="Enter your order here"
                      withButton
                      title="New Order"
                      loading={loading}
                      onCancel={onClose}
                    /> : (
                      <StandardHeader3Buttons
                        title={status === "IN_USE" ? "Order" : "New Order"}
                        description={status === "IN_USE" ? "" : "Create order sales for this machine."}
                        withButton={true}
                        buttonName={status === "IN_USE" ? "Update" : "Save Order"}
                        loading={loading}
                        onBack={onClose}
                      />)
                  }
                </div>
                <input type="hidden" name="machineId" value={machineId} />
                {activeOrder && <input type="hidden" name="orderId" value={activeOrder.id} />}

                <CustomerInput
                  name="customerName"
                  required
                  defaultValue={activeOrder?.customer?.name ?? ""}
                  customers={customers}
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <fieldset className="relative rounded-md border border-gray-200 mt- p-2">
                    <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Order Type
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                      <label>
                        <input
                          type="radio"
                          name="orderType"
                          value="WALK_IN"
                          checked={selectedOrderType === "WALK_IN"}
                          onChange={(event) => setSelectedOrderType(event.target.value)}
                        /> Walk-in
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="orderType"
                          value="DELIVERY"
                          checked={selectedOrderType === "DELIVERY"}
                          onChange={(event) => setSelectedOrderType(event.target.value)}
                        /> Delivery
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="relative rounded-md border border-gray-200 p-2">
                    <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Base Service
                    </legend>
                    <div className="mt-2 flex flex-col gap-2">
                      {baseServices.length === 0 && (
                        <p className="text-sm text-red-600">
                          No {baseServiceType} service is configured for this shop.
                        </p>
                      )}
                      {baseServices.map((service) => (
                        <label key={service.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="baseServiceId"
                            value={service.id}
                            defaultChecked={activeOrder
                              ? activeOrder.items?.some((item: any) => item.serviceId === service.id)
                              : service.id === baseServices[0]?.id}
                            required
                          />
                          {service.name} (₱{service.price.toFixed(2)})
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <fieldset className="relative rounded-md border border-gray-200 p-2 mt-6">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Additional Services
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {extraServices.map((service) => (
                      <label key={service.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="extraServices"
                          value={service.id}
                          defaultChecked={activeOrder?.items?.some((item: any) => item.serviceId === service.id)}
                          className="h-4 w-4"
                        />
                        {service.name} (₱{service.price})
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="relative rounded-md border border-gray-200 p-2 mt-6">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Inventory Items
                  </legend>
                  <div className="flex flex-col gap-2 mt-2">
                    {inventoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-2"
                      >
                        <span className="text-sm">
                          {item.name} ({item.unit}) — ₱{item.price.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-500">
                            ({item.stock} available)
                          </span>
                        </span>
                        <input
                          type="number"
                          name={`inventory_${item.id}`}
                          min={0}
                          max={item.stock}
                          step={1}
                          defaultValue={activeOrder?.items?.find((orderItem: any) => orderItem.inventoryItemId === item.id)?.quantity ?? 0}
                          aria-label={`Quantity of ${item.name}`}
                          className="w-20 rounded-md border border-gray-300 p-1 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="relative rounded-md border border-gray-200 p-2 mt-6">
                  <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Payment Method
                  </legend>
                  <div className="flex gap-4 mt-2">
                    <label>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH"
                        required
                        checked={selectedPaymentMethod === "CASH"}
                        onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                      /> Cash
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARD"
                        checked={selectedPaymentMethod === "CARD"}
                        onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                      /> Card
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="EWALLET"
                        checked={selectedPaymentMethod === "EWALLET"}
                        onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                      /> E-Wallet
                    </label>
                  </div>
                  <div className="mt-4">
                    <label>
                      <input
                        type="checkbox"
                        name="paid"
                        checked={isPaid}
                        onChange={(event) => setIsPaid(event.target.checked)}
                      /> Paid
                    </label>
                  </div>
                </fieldset>
                {/* Comment: Add comment section for the laundry order */}
                <div className="mt-4">
                  <label>
                    Comment:
                    <textarea
                      name="comment"
                      defaultValue={activeOrder?.comment ?? ""}
                      className="w-full rounded-md border border-gray-300 p-1"
                    />
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