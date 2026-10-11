"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import { updateExpenseAction, deleteExpenseAction } from "../actions/expenseActions";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import ExpenseCategoryField from "./ExpenseCategoryField";
import PettyCashSwitch from "./PettyCashSwitch";
import { expenseCategoryLabel, type ExpenseDetail } from "../types/expenseTypes";

type Props = {
  expense: ExpenseDetail | null;
  expenseListHref: string;
};

export default function EditExpenseForm({ expense, expenseListHref }: Props) {
  const router = useRouter();
  const { orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const [deductFromPettyCash, setDeductFromPettyCash] = useState(
    expense?.deductFromPettyCash ?? false,
  );

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
    <div className="min-h-[calc(100svh-8rem)] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-8 sm:pt-12 mt-4 sm:mt-8 pb-24 sm:pb-34 mb-4">
      <FormContainer action={updateExpenseAction} onSuccess={() => router.push(expenseListHref)}>
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <StandardFormTitle
                title="Edit Expense"
                description="Update or delete this expense record."
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  disabled={loading || deleteLoading}
                  variant="standard"
                  className="bg-orange-200 hover:bg-orange-300"
                  onClick={() => router.push(expenseListHref)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} variant="standard">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                </Button>
                <DeleteButton
                  loading={deleteLoading}
                  onClick={onDelete}
                  className="bg-red-200 hover:bg-red-300"
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
              <input type="hidden" name="id" value={expense.id} />
              <ExpenseCategoryField defaultCategory={expense.category} />
              {isAdmin && (
                <StandardInput
                  name="expenseDate"
                  type="date"
                  label="Expense date"
                  defaultValue={expense.expenseDate}
                  required
                />
              )}
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
              <PettyCashSwitch
                checked={deductFromPettyCash}
                onChange={setDeductFromPettyCash}
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
