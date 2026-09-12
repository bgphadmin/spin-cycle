"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { actionFunction } from "@/utils/types";

type UseDeleteActionOptions = {
  successMessage: string;
  redirectTo: string;
  confirmationMessage?: string;
};

export function useDeleteAction(
  action: actionFunction,
  {
    successMessage,
    redirectTo,
    confirmationMessage = "Are you sure you want to delete this item? This action cannot be undone.",
  }: UseDeleteActionOptions
) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const onDelete = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        const form = event.currentTarget.form;

        if (!form) {
          toast.error("Unable to delete item");
          return;
        }

        setPendingFormData(new FormData(form));
        setConfirmationOpen(true);
      },
      []
  );

  const confirmDelete = useCallback(async () => {
      if (!pendingFormData) {
        toast.error("Unable to delete item");
        return;
      }

      try {
        setLoading(true);
        const result = await action(null, pendingFormData);

        if (result.message !== successMessage) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        setConfirmationOpen(false);
        setPendingFormData(null);
        router.push(redirectTo);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Unable to delete item");
      } finally {
        setLoading(false);
      }
  }, [action, pendingFormData, redirectTo, router, successMessage]);

  const cancelDelete = useCallback(() => {
      if (!loading) {
        setConfirmationOpen(false);
        setPendingFormData(null);
      }
  }, [loading]);

  return {
      onDelete,
      confirmDelete,
      cancelDelete,
      confirmationMessage,
      isConfirmationOpen,
      loading,
  };
}
