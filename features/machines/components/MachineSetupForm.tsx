"use client";

import FormContainer from "@/components/utils/FormContainer";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import { useRef, useState } from "react";
import { addMachineAction } from "../actions/addMachineAction";
import StandardHeader from "@/components/utils/StandardHeader";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import { redirect, useRouter } from "next/navigation";
// import { useRouter } from "next/router";

export default function MachineSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = async () => {
    // ✅ Clear the form fields after successful submission
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const { orgRole } = useClientAuthClaims()

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <form ref={formRef}></form>
      <FormContainer
        action={addMachineAction}
        onSuccess={handleSuccess}
        ref={formRef}
      >
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader2
              buttonName="Save"
              withButton={orgRole === "org:admin"}
              title="Add Machines"
              description="Add washers and dryers for your shop."
              loading={loading}
              onCancel={() => router.back()}
            />
            <div className="grid gap-5 sm:grid-cols-2 ">
              <StandardInput name="name" placeholder="Machine Name (e.g. Washer 1)" required />
              <StandardRadioGroup
                name="type"
                label="Type"
                required
                options={[
                  { value: "washer", label: "Washer" },
                  { value: "dryer", label: "Dryer" },
                ]}
              />
              <StandardInput name="location" placeholder="Location (optional)" />
              <div className="sm:col-span-2">
                <StandardInput name="comment" placeholder="Place your comment here" as="textarea" required />
              </div>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}