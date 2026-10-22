"use client";

import { useState, useTransition } from "react";
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
import { recordTubCleaningAction } from "@/features/machines/actions/machineActions";

export default function RecordTubCleaningButton({
  machineId,
  machineName,
  cyclesSinceTubCleaning,
  disabled,
}: {
  machineId: string;
  machineName: string;
  cyclesSinceTubCleaning: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();

  function handleConfirm() {
    startSaving(async () => {
      try {
        const result = await recordTubCleaningAction(machineId);
        const parsed = JSON.parse(result.message);
        if (parsed[0]?.result !== "success") {
          toast.error(parsed[0]?.message ?? "Unable to record tub cleaning.");
          return;
        }

        toast.success(parsed[0].message);
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to record tub cleaning.");
      }
    });
  }

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
            Record tub cleaning
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto bg-white"
          onClick={(event) => event.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Record tub cleaning for {machineName}?</AlertDialogTitle>
            <p className="text-sm text-gray-600">
              This resets the tub-cleaning counter from {cyclesSinceTubCleaning} cycles to zero. Lifetime usage will not change.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              disabled={saving}
              className="h-auto w-full rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 shadow-md transition-colors hover:bg-red-200 sm:w-auto sm:px-4 sm:py-2"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="standard"
              disabled={saving}
              onClick={handleConfirm}
              className="h-auto w-full px-3 py-2 text-sm sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              {saving ? "Saving..." : "Confirm tub cleaning"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
