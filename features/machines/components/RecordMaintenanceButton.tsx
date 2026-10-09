"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { recordMachineMaintenanceAction } from "@/features/machines/actions/machineActions";

export default function RecordMaintenanceButton({
  machineId,
  machineName,
  cyclesSinceMaintenance,
  disabled,
  returnTo,
}: {
  machineId: string;
  machineName: string;
  cyclesSinceMaintenance: number;
  disabled: boolean;
  returnTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, startSaving] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await recordMachineMaintenanceAction(machineId, notes);
        const parsed = JSON.parse(result.message);
        if (parsed[0]?.result !== "success") {
          toast.error(parsed[0]?.message ?? "Unable to record maintenance.");
          return;
        }

        toast.success(parsed[0].message);
        setNotes("");
        setOpen(false);
        router.push(returnTo);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to record maintenance.");
      }
    });
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="standard_sm"
            disabled={disabled}
            onClick={(event) => event.stopPropagation()}
          >
            Record maintenance
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto bg-white"
          onClick={(event) => event.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Record maintenance for {machineName}?</AlertDialogTitle>
            <p className="text-sm text-gray-600">
              This records the current {cyclesSinceMaintenance} cycles in maintenance history
              and resets the maintenance cycle counter. Lifetime usage will not change.
            </p>
          </AlertDialogHeader>
          <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="space-y-4"
          >
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Notes (optional)
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                placeholder="Maintenance performed"
              />
            </label>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={saving}
                className="h-auto w-full rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 shadow-md transition-colors hover:bg-red-200 sm:w-auto sm:px-4 sm:py-2"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="standard"
                disabled={saving}
                className="h-auto w-full px-3 py-2 text-sm sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
              >
                {saving ? "Saving..." : "Confirm maintenance"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
