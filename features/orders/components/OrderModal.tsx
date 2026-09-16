"use client";

import { useEffect, useState } from "react";
import FormContainer from "@/components/utils/FormContainer";
import { createOrderAction } from "../../(pos)/tenantDashBoard/actions/createOrderAction";
import { cancelOrderAction, completeOrderAction, getActiveOrderAction, updateOrderAction } from "../../(pos)/tenantDashBoard/actions/orderActions";
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
  const [actionLoading, setActionLoading] = useState<"complete" | "cancel" | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedOrderType, setSelectedOrderType] = useState("WALK_IN");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setActiveOrder(null);
    setSelectedPaymentMethod("");
    setSelectedOrderType("WALK_IN");

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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6">
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
                      description={status === "IN_USE" ? "Manage your order." : "Create order sales for this machine."}
                      withButton={true}
                      buttonName={status === "IN_USE" ? "Update" : "Save Order"}
                      loading={loading}
                      disabled={actionLoading !== null}
                      actionLoading={actionLoading}
                      showCompleteCancel={status === "IN_USE" && !!activeOrder}
                      onComplete={async () => {
                        setActionLoading("complete");
                        await completeOrderAction(activeOrder.id);
                        onClose();
                      }}
                      onCancel={async () => {
                        setActionLoading("cancel");
                        await cancelOrderAction(activeOrder.id);
                        onClose();
                      }}
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

              <fieldset className="relative rounded-md border border-gray-200 p-2 mt-6">
                <legend className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-gray-700">
                  Order Type
                </legend>
                <div className="flex gap-4 mt-2">
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

              <fieldset className="relative rounded-md border border-gray-200 p-2 mt-8">
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
              </fieldset>
            </div>
          )}
          </FormContainer>
        )}
      </div>
    </div>
  );
}