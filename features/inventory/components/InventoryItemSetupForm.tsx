"use client";

import { useRef } from "react";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader from "@/components/utils/StandardHeader";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { addInventoryItemAction } from "../actions/inventoryActions";

export default function InventoryItemSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { orgRole } = useClientAuthClaims();

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer
        action={addInventoryItemAction}
        onSuccess={() => formRef.current?.reset()}
        ref={formRef}
      >
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader
              buttonName="Save"
              withButton={orgRole === "org:admin"}
              title="Add Inventory Item"
              description="Add stock items and supplies used by your shop."
              loading={loading}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <StandardInput name="name" placeholder="Item Name" required />
              <StandardRadioGroup
                name="type"
                label="Type"
                required
                options={[
                  { value: "retail", label: "Retail" },
                  { value: "consumable", label: "Consumable" },
                ]}
              />
              <StandardInput name="unit" placeholder="Unit (e.g. bottle, pack, ml)" required />
              <StandardInput name="stock" type="number" min="0" step="1" placeholder="Stock" required />
              <StandardInput name="price" type="number" min="0" step="0.01" placeholder="Price" required />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
