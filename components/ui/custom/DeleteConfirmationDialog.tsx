"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteButton } from "./DeleteButton";

type DeleteConfirmationDialogProps = {
  open: boolean;
  loading?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  open,
  loading = false,
  message,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <AlertDialogContent className="border-orange-100 bg-white shadow-2xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-gray-900">
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            onClick={onCancel}
            className="h-auto w-full border-gray-200 px-4 py-3 text-sm sm:w-auto sm:px-8 sm:py-2 sm:text-lg bg-teal-200 hover:bg-teal-300 hover:cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <DeleteButton
            loading={loading}
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
