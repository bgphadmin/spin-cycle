"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useSession } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { registerShopAction } from "../actions";
import { COMMON_TIME_ZONES, DEFAULT_TIME_ZONE } from "@/utils/timeZones";

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
    <div className="max-h-[94vh] flex items-start justify-center bg-white
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
              <label className="sm:col-span-2 space-y-2 text-sm font-medium text-foreground">
                Business time zone
                <select
                  name="timeZone"
                  defaultValue={DEFAULT_TIME_ZONE}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  {COMMON_TIME_ZONES.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>{timeZone}</option>
                  ))}
                </select>
                <span className="block text-xs font-normal text-muted-foreground">
                  Used to determine the business date for Today&apos;s Sales.
                </span>
              </label>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}