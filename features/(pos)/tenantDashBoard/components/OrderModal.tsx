"use client";

import { useEffect, useState } from "react";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader from "@/components/utils/StandardHeader";
import { createOrderAction } from "../actions/createOrderAction";
import { getInventoryAction, getServicesAction } from "@/features/orders/actions/getData";
import { StandardInput } from "@/components/utils/StandardInput";

type OrderModalProps = {
  machineId: string;
  type: "washer" | "dryer";
  onClose: () => void;
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
};

export default function OrderModal({ machineId, type, onClose }: OrderModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const resServices = await getServicesAction();
      const resInventory = await getInventoryAction();
      setServices(resServices);
      setInventoryItems(resInventory);
    }
    fetchData();
  }, []);

  const baseServiceType = type === "washer" ? "WASH" : "DRY";
  const baseServices = services.filter((service) => service.type === baseServiceType);
  const extraServices = services.filter((service) => service.type === "OTHERS");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6">
        <FormContainer action={createOrderAction} onSuccess={onClose}>
          {({ loading }) => (
            <div className="space-y-6">
              <StandardHeader
                title="New Order"
                description="Create order sales for this machine."
                withButton
                buttonName="Save Order"
                loading={loading}
              />

              <input type="hidden" name="machineId" value={machineId} />

              <StandardInput
                name="customerName"
                type="text"
                placeholder="Customer Name"
                required
              />

              <div>
                <label className="font-medium">Base Service</label>
                <div className="mt-2 flex flex-col gap-2">
                  {baseServices.length === 0 && (
                    <p className="text-sm text-red-600">
                      No {baseServiceType} service is configured for this shop.
                    </p>
                  )}
                  {baseServices.map((service) => (
                    <label key={service.id} className="flex items-center gap-2">
                      <input type="radio" name="baseServiceId" value={service.id} defaultChecked required />
                      {service.name} (₱{service.price.toFixed(2)})
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium">Additional Services</label>
                <div className="flex flex-col gap-2 mt-2">
                  {extraServices.map((service) => (
                    <label key={service.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="extraServices"
                        value={service.id}
                        className="h-4 w-4"
                      />
                      {service.name} (₱{service.price})
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium">Inventory Items</label>
                <div className="flex flex-col gap-2 mt-2">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span>{item.name} (₱{item.price})</span>
                      <input
                        type="number"
                        name={`inventory_${item.id}`}
                        // value={item.id}
                        min={0}
                        defaultValue={0}
                        className="w-20 border rounded-md p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="font-medium">Payment Method</label>
                <div className="flex gap-4 mt-2">
                  <label>
                    <input type="radio" name="paymentMethod" value="cash" required /> Cash
                  </label>
                  <label>
                    <input type="radio" name="paymentMethod" value="card" /> Card
                  </label>
                  <label>
                    <input type="radio" name="paymentMethod" value="gcash" /> GCash
                  </label>
                </div>
              </div>
            </div>
          )}
        </FormContainer>
      </div>
    </div>
  );
}