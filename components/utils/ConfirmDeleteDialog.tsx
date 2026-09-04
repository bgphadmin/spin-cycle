"use client";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import LoadingDeleteButton from "../utils/LoadingDeleteButton";

type ConfirmDeleteDialogProps = {
  itemName: string;
  deleting: boolean;
  onDelete: () => void;
  /** Optional custom trigger button */
  trigger?: React.ReactNode;
};

export function ConfirmDeleteDialog({
  itemName,
  deleting,
  onDelete,
  trigger,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        {trigger ?? (
          <LoadingDeleteButton
            loading={deleting}
            type="button"
            className="flex-1 h-11 rounded-md bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
          >
            Delete
          </LoadingDeleteButton>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white border border-gray-200 rounded-lg p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-red-600">
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{itemName}</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-2">
          <AlertDialogCancel className="flex-1 h-11 rounded-md bg-slate-500 px-6 py-2 text-white hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          <LoadingDeleteButton
            onClick={onDelete}
            loading={deleting}
            type="button"
            className="flex-1 h-11 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Yes, Delete
          </LoadingDeleteButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}