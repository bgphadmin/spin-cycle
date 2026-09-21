"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { addCustomerAction } from "../actions/customerActions";

export default function CustomerSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { isLoaded } = useClientAuthClaims();
  const router = useRouter();

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={addCustomerAction} onSuccess={() => formRef.current?.reset()} ref={formRef}>
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader2
              buttonName="Save"
              withButton={isLoaded}
              title="Add Customer"
              description="Add a customer to your shop."
              loading={loading}
              onCancel={() => router.back()}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <StandardInput name="name" label="Name" placeholder="Customer name" required />
              <StandardInput name="phone" label="Phone" type="tel" placeholder="Phone number" />
              <StandardInput name="email" label="Email" type="email" placeholder="Email address" />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
