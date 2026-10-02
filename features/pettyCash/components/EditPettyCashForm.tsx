"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import {
  deletePettyCashAction,
  updatePettyCashAction,
} from "@/features/pettyCash/actions/pettyCashActions";
import type { PettyCashDetail } from "@/features/pettyCash/types/pettyCashTypes";

export default function EditPettyCashForm({ entry }: { entry: PettyCashDetail | null }) {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const listPath = `/tenants/${tenantSlug}/tenantDashboard/pettyCash`;
  const {
    onDelete,
    confirmDelete,
    cancelDelete,
    confirmationMessage,
    isConfirmationOpen,
    loading: deleteLoading,
  } = useDeleteAction(deletePettyCashAction, {
    successMessage: "Petty cash entry deleted successfully",
    redirectTo: listPath,
    confirmationMessage: entry
      ? `Deleting "${entry.name}" cannot be undone!`
      : "Deleting this petty cash entry cannot be undone!",
  });

  if (!entry) return <div>Petty cash entry not found.</div>;

  return (
    <div className="max-h-[94vh] flex items-start justify-center rounded-lg bg-white px-4 pt-12 pb-34 shadow-2xl sm:px-6 lg:px-8 mt-8 mb-4">
      <FormContainer action={updatePettyCashAction} onSuccess={() => router.push(listPath)}>
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <StandardFormTitle
                title="Edit Petty Cash"
                description="Update or delete this petty cash record."
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={loading} variant="standard">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                </Button>
                <DeleteButton loading={deleteLoading} onClick={onDelete} />
                <DeleteConfirmationDialog
                  open={isConfirmationOpen}
                  loading={deleteLoading}
                  message={confirmationMessage}
                  onCancel={cancelDelete}
                  onConfirm={confirmDelete}
                />
              </div>
            </div>
            <div className="mx-auto h-0.5 rounded-full bg-gray-300 shadow-inner" />
            <div className="grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={entry.id} />
              <StandardInput
                name="name"
                label="Name"
                placeholder="What was the petty cash used for?"
                defaultValue={entry.name}
                maxLength={100}
                required
              />
              <StandardInput
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                defaultValue={entry.amount}
                required
              />
              <StandardInput
                name="notes"
                as="textarea"
                placeholder="Notes (optional)"
                defaultValue={entry.notes ?? ""}
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
