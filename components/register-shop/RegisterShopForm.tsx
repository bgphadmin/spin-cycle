"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormContainer from "@/components/utils/FormContainer";
import { registerShopAction } from "@/utils/actions/registerShopAction";

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
              <div className="mt-0">
                <h1 className="text-3xl font-bold text-teal-700">Register your shop</h1>
                <p className="mt-2 text-muted-foreground">
                  Add your shop details to finish setting up your account.
                </p>
              </div>
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
              <Input id="shopName" name="shopName" className="rounded h-12 bg-gray-100" placeholder="Shop Name" required />
              <Input id="contactPerson" name="contactPerson" className="rounded h-12 bg-gray-50" placeholder="Contact Person" required />
              <Input id="contactPosition" name="contactPosition" className="rounded h-12 bg-gray-100" placeholder="Contact Position" />
              <Input id="phone" name="phone" className="rounded h-12 bg-gray-100" placeholder="Phone" type="tel" required />
              <Input id="email" name="email" className="rounded h-12 bg-gray-100" placeholder="Email" type="email" />
              <Field label="" name="address" required className="sm:col-span-2">
                <Textarea id="address" name="address" className="rounded h-12 bg-gray-100" placeholder="Address" required />
              </Field>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  className,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
