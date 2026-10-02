"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { addPettyCashAction } from "@/features/pettyCash/actions/pettyCashActions";

export default function PettyCashSetupForm({ initialCashDate }: { initialCashDate: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { isLoaded, orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  function handleSuccess() {
    formRef.current?.reset();
    setFormKey((key) => key + 1);
  }

  return (
    <div className="max-h-[94vh] flex items-start justify-center rounded-lg bg-white px-4 pt-12 pb-34 shadow-2xl sm:px-6 lg:px-8 mt-8 mb-4">
      <FormContainer action={addPettyCashAction} onSuccess={handleSuccess} ref={formRef}>
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader2
              buttonName="Save"
              withButton={isLoaded}
              title="Add Petty Cash"
              description="Record a petty cash purchase or withdrawal."
              loading={loading}
              onCancel={() => router.back()}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <StandardInput name="name" label="Name" placeholder="What was the petty cash used for?" maxLength={100} required />
              {isAdmin && (
                <StandardInput
                  name="cashDate"
                  type="date"
                  label="Date"
                  defaultValue={initialCashDate}
                  required
                />
              )}
              <StandardInput
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                required
              />
              <StandardInput
                name="notes"
                as="textarea"
                placeholder="Notes (optional)"
                maxLength={500}
                className="rounded bg-gray-100 px-3 py-2 text-sm shadow-lg ring-1 focus:ring-2 focus:ring-teal-500 sm:col-span-2"
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
