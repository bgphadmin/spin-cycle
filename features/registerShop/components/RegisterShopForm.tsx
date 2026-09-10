"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useSession } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { registerShopAction } from "../actions";

export default function RegisterShopForm() {
  const router = useRouter();
  const { session } = useSession(); // 2. Grab the session object

  const handleSuccess = async () => {
    // 3. Force Clerk client to fetch a fresh JWT token with the new metadata
    if (session) {
      await session.reload();
    }
    // 4. Redirect after the session is successfully synchronized
    router.push("/");
  };

  return (
    <div className="max-h-[80vh] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer
        action={registerShopAction}
        onSuccess={handleSuccess}
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
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
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