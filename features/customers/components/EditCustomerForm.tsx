"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import { Loader2 } from "lucide-react";
import { deleteCustomerAction, updateCustomerAction } from "../actions/customerActions";
import type { CustomerDetail } from "../types/customerTypes";

export default function EditCustomerForm({ customer }: { customer: CustomerDetail | null }) {
  const router = useRouter();
  const { onDelete, confirmDelete, cancelDelete, confirmationMessage, isConfirmationOpen, loading: deleteLoading } =
    useDeleteAction(deleteCustomerAction, {
      successMessage: "Customer deleted successfully",
      redirectTo: "../",
      confirmationMessage: customer ? `Deleting ${customer.name} cannot be undone!` : "Deleting this customer cannot be undone!",
    });

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={updateCustomerAction} onSuccess={() => router.push("../")}>
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <StandardFormTitle title="Edit Customer" description="Update or delete this customer record." />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={loading} variant="standard">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                </Button>
                <DeleteButton loading={deleteLoading} onClick={onDelete} />
                <DeleteConfirmationDialog open={isConfirmationOpen} loading={deleteLoading} message={confirmationMessage} onCancel={cancelDelete} onConfirm={confirmDelete} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={customer.id} />
              <StandardInput name="name" label="Name" placeholder="Customer name" defaultValue={customer.name} required />
              <StandardInput name="phone" label="Phone" type="tel" placeholder="Phone number" defaultValue={customer.phone ?? ""} />
              <StandardInput name="email" label="Email" type="email" placeholder="Email address" defaultValue={customer.email ?? ""} />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
