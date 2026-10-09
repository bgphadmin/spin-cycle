"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const normalizedStatus = machine?.status.toUpperCase();
  const isInUse = normalizedStatus === "IN_USE";
  const [isAvailable, setIsAvailable] = useState(normalizedStatus === "AVAILABLE");
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(
    machine?.maintenanceEnabled ?? true,
  );

  useEffect(() => {
    setIsAvailable(normalizedStatus === "AVAILABLE");
  }, [normalizedStatus]);
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
    <div className="box-border w-full min-w-0 rounded-lg bg-white p-4 shadow-2xl sm:p-6 lg:p-8">
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
                <Button
                  type="button"
                  variant="standard"
                  className="bg-red-100 text-red-800 hover:bg-red-200"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
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
              <div className="flex items-center gap-3 rounded-md border border-gray-300 px-3 h-12 shadow-sm">
                <input
                  type="hidden"
                  name="status"
                  value={isInUse ? "IN_USE" : isAvailable ? "AVAILABLE" : "UNAVAILABLE"}
                />
                <input
                  id="machine-available"
                  type="checkbox"
                  checked={isInUse || isAvailable}
                  disabled={isInUse}
                  onChange={(event) => setIsAvailable(event.target.checked)}
                  className="h-4 w-4 accent-teal-600"
                />
                <label htmlFor="machine-available" className="text-sm font-medium text-gray-700">
                  Available
                </label>
              </div>
              <StandardInput name="usageCount" type="number" placeholder="Usage Count" defaultValue={machine.usageCount} />
              <div className="sm:col-span-2 space-y-3 rounded-md border border-gray-200 p-4">
                <p className="text-sm text-gray-500">
                  {maintenanceEnabled
                    ? `Cycle tracking is on: ${machine.cyclesSinceMaintenance} cycles since last maintenance.`
                    : "Cycle tracking and alerts are paused while this is off."}
                </p>
                <input type="hidden" name="maintenanceEnabled" value="false" />
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="maintenanceEnabled"
                    value="true"
                    checked={maintenanceEnabled}
                    onChange={(event) => setMaintenanceEnabled(event.target.checked)}
                    className="h-4 w-4 accent-teal-600"
                  />
                  Use cycle-based maintenance alerts for this machine. (Recommended: 3000 cycles)
                </label>
                {maintenanceEnabled && (
                  <StandardInput
                    name="maintenanceIntervalCycles"
                    type="number"
                    min={1}
                    max={1000000}
                    placeholder="Maintenance interval (cycles)"
                    defaultValue={machine.maintenanceIntervalCycles}
                    required
                  />
                )}
              </div>
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