"use client";

import { useRouter } from "next/navigation";
import FormContainer from "@/components/utils/FormContainer";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import { useRef } from "react";
import { addMachineAction } from "../actions/addMachineAction";
import StandardHeader from "@/components/utils/StandardHeader";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";

export default function MachineSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSuccess = async () => {
    // ✅ Clear the form fields after successful submission
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const {orgRole} = useClientAuthClaims()

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
            <StandardHeader
              buttonName="Save"
              withButton={orgRole === "org:admin"}
              title="Add Machines"
              description="Add washers and dryers for your shop."
              loading={loading}
            />
            {/* <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Add Machines"
                description="Add washers and dryers for your shop."
              />
              <Button
                type="submit"
                disabled={loading}
                variant="standard"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div> */}
            {/* <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" /> */}
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