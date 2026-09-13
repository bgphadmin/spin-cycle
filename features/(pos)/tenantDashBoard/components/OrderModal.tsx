"use client";

import { useEffect, useState } from "react";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader from "@/components/utils/StandardHeader";
import { Button } from "@/components/ui/button";
import { createOrderAction } from "../actions/createOrderAction";

type OrderModalProps = {
  machineId: string;
  type: "washer" | "dryer";
  onClose: () => void;
};

type Service = {
  id: string;
  name: string;
  price: number;
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
    // Fetch services dynamically
    async function fetchData() {
      const resServices = await fetch("/api/services");
      const resInventory = await fetch("/api/inventory");
      setServices(await resServices.json());
      setInventoryItems(await resInventory.json());
    }
    fetchData();
  }, []);

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

              {/* Base service auto-selected */}
              <input
                type="hidden"
                name="baseService"
                value={type === "washer" ? "wash" : "dry"}
              />

              {/* Dynamic additional services */}
              <div>
                <label className="font-medium">Additional Services</label>
                <div className="flex flex-col gap-2 mt-2">
                  {services.map((service) => (
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

              {/* Dynamic inventory items */}
              <div>
                <label className="font-medium">Inventory Items</label>
                <div className="flex flex-col gap-2 mt-2">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span>{item.name} (₱{item.price})</span>
                      <input
                        type="number"
                        name={`inventory_${item.id}`}
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