"use client";

import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { Loader2 } from "lucide-react";
import { StandardFormTitle } from "@/components/utils/StandardTitle";
import { StandardInput } from "@/components/utils/StandardInput";
import { inviteStaffAction } from "../action";

export default function InviteStaffForm() {

  const handleSuccess = (state: { message: string }) => {
    const parsed = JSON.parse(state.message)

    // Find the input fields globally or within the document and reset them manually
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;

    if (emailInput) emailInput.value = "";
  }

  return (
    <div className="max-h-[80vh]  flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg mt-6 pb-30 pt-20 mb-4">
      <FormContainer
        action={inviteStaffAction}
        onSuccess={handleSuccess}      
      >
        {({ loading }) => (
          <div className="space-y-6 w-full max-w-2xl">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Invite Staff Member"
                description="Send a secure registration link to add staff to your shop dashboard."
              />
              <Button
                type="submit"
                disabled={loading}
                variant="standard"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Invite"}
              </Button>
            </div>

            <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" />

            <div className="grid gap-5 sm:grid-cols-2">
              <StandardInput
                name="email"
                placeholder="Email"
                type="email"
                required
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}