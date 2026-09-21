"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import { updateExpenseAction, deleteExpenseAction } from "../actions/expenseActions";
import ExpenseCategoryField from "./ExpenseCategoryField";
import { expenseCategoryLabel, type ExpenseDetail } from "../types/expenseTypes";

type Props = {
  expense: ExpenseDetail | null;
};

export default function EditExpenseForm({ expense }: Props) {
  const router = useRouter();

  const {
    onDelete,
    confirmDelete,
    cancelDelete,
    confirmationMessage,
    isConfirmationOpen,
    loading: deleteLoading,
  } = useDeleteAction(deleteExpenseAction, {
    successMessage: "Expense deleted successfully",
    redirectTo: "../",
    confirmationMessage: expense
      ? `Deleting this ${expenseCategoryLabel(expense.category)} expense cannot be undone!`
      : "Deleting this expense cannot be undone!",
  });

  if (!expense) {
    return <div>Expense not found</div>;
  }

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={updateExpenseAction} onSuccess={() => router.push("../")}>
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Edit Expense"
                description="Update or delete this expense record."
              />
              <div className="flex flex-col sm:flex-row gap-2">
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
            <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" />
            <div className="grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={expense.id} />
              <ExpenseCategoryField defaultCategory={expense.category} />
              <StandardInput
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                defaultValue={expense.amount}
                required
              />
              <StandardInput
                name="notes"
                as="textarea"
                placeholder="Notes (optional)"
                defaultValue={expense.notes ?? ""}
                className="rounded bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 shadow-lg ring-1 sm:col-span-2"
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
