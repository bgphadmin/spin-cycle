"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { Loader2 } from "lucide-react";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import { updateMachineAction, deleteMachineAction } from "@/features/machines/actions/machineActions";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import NotAllowed from "@/app/not-allowed";
import { Machine } from "../types/machineTypes";

type Props = {
  userRole: string;
  machine: Machine | null;
};

export default function EditMachineForm({ userRole, machine }: Props) {

  const router = useRouter();
  const {
    onDelete,
    confirmDelete,
    cancelDelete,
    confirmationMessage,
    isConfirmationOpen,
    loading: deleteLoading,
  } = useDeleteAction(
    deleteMachineAction,
    {
      successMessage: "Machine deleted successfully",
      redirectTo: "../",
      confirmationMessage: `Deleting machine ${machine?.name} cannot be undone!`
    });
  if (!machine) {
    return <div>Machine not found</div>; // or redirect
  }
  if (userRole !== "org:admin") {
    return <NotAllowed />;
  }
  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer
        action={updateMachineAction}
        onSuccess={() => router.push("../")}
      >
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Edit Machine"
                description="Update or delete this machine record."
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={loading} variant="standard">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                </Button>
                <DeleteButton
                  loading={deleteLoading}
                  onClick={onDelete}
                />
                <DeleteConfirmationDialog
                  open={isConfirmationOpen}
                  loading={deleteLoading}
                  message={confirmationMessage}
                  onCancel={cancelDelete}
                  onConfirm={confirmDelete}
                />
              </div>
            </div>
            <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" />
            <div className="grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={machine.id} />
              <StandardInput name="name" placeholder="Machine Name" defaultValue={machine.name} required />
              <StandardRadioGroup
                name="type"
                label="Type"
                required
                options={[
                  { value: "washer", label: "Washer" },
                  { value: "dryer", label: "Dryer" },
                ]}
                defaultValue={machine.type}
              />
              <StandardInput name="status" placeholder="Status" defaultValue={machine.status} required />
              <StandardInput name="usageCount" type="number" placeholder="Usage Count" defaultValue={machine.usageCount} />
              <div className="sm:col-span-2">
                <StandardInput name="location" placeholder="Location" defaultValue={machine.location ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <StandardInput name="comment" placeholder="Comment" as="textarea" defaultValue={machine.comment ?? ""} />
              </div>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}