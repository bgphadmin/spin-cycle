"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { registerShopAction } from "@/utils/actions/registerShopAction";
import { StandardInput } from "../utils/StandardInput";
import { StandardFormTitle } from "../utils/StandardTitle";

export default function RegisterShopForm() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg mt-8 pb-12 mb-4">
      <FormContainer
        action={registerShopAction}
        onSuccess={() => router.push("/dashboard")}
      >
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Register your shop"
                description="Add your shop details to finish setting up your account."
              />
              <Button
                type="submit"
                disabled={loading}
                variant="standard"
              >
                {loading ? "Registering..." : "Submit"}
              </Button>
            </div>
            <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" />
            <div className="grid gap-5 sm:grid-cols-2 ">
              <StandardInput name="shopName" placeholder="Shop Name" required />
              <StandardInput name="contactPerson" placeholder="Contact Person" required />
              <StandardInput name="contactPosition" placeholder="Contact Position" />
              <StandardInput name="phone" placeholder="Phone" type="tel" required />
              <StandardInput name="email" placeholder="Email" type="email" />
              <div className="sm:col-span-2">
                <StandardInput name="address" placeholder="Address" as="textarea" required />
              </div>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}