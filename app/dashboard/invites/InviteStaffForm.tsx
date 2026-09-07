"use client";

import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { Loader2 } from "lucide-react";
import { StandardFormTitle } from "@/components/utils/StandardTitle";
import { StandardInput } from "@/components/utils/StandardInput";
import { createInviteAction } from "@/utils/actions/invitations";

export default function InviteStaffForm() {

  const handleSuccess = (state: { message: string }) => {
    const parsed = JSON.parse(state.message)

    console.log("Parsed Message: ", parsed)

    // Find the input fields globally or within the document and reset them manually
    const nameInput = document.querySelector('input[name="staffName"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;

    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg mt-8 pb-12 mb-4">
      <FormContainer
        action={createInviteAction}
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
                name="staffName"
                placeholder="Name"
                required
              />
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