"use client";

import { useRef } from "react";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader from "@/components/utils/StandardHeader";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import { addServiceAction } from "../actions/addServiceAction";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { useRouter } from "next/navigation";
import StandardHeader2 from "@/components/utils/StandardHeader2";

export default function ServiceSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { orgRole } = useClientAuthClaims();
  const router = useRouter()

  const handleSuccess = () => {
    formRef.current?.reset();
  };

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={addServiceAction} onSuccess={handleSuccess} ref={formRef}>
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader2
              buttonName="Save"
              withButton={orgRole === "org:admin"}
              title="Add Service"
              description="Add a laundry service and its pricing to your shop."
              loading={loading}
              onCancel={() => router.back()}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <StandardRadioGroup
                name="type"
                label="Type"
                required
                options={[
                  { value: "WASH", label: "WASH" },
                  { value: "DRY", label: "DRY" },
                  { value: "OTHERS", label: "OTHERS" },
                ]}
              />
              <StandardInput
                name="name"
                placeholder="Service Name (e.g. Wash and Fold)"
                required
              />
              <StandardInput
                name="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                required
              />
              <StandardInput
                name="duration"
                type="number"
                min="1"
                step="1"
                placeholder="Duration in minutes (optional)"
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
