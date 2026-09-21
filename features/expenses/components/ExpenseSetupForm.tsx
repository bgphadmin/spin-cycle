"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FormContainer from "@/components/utils/FormContainer";
import StandardHeader2 from "@/components/utils/StandardHeader2";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { useClientAuthClaims } from "@/utils/hooks/useAuthClaimsClient";
import { addExpenseAction } from "../actions/expenseActions";
import ExpenseCategoryField from "./ExpenseCategoryField";

function todayDateKey() {
  const today = new Date();
  return [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((value, index) => (index === 0 ? String(value) : String(value).padStart(2, "0")))
    .join("-");
}

export default function ExpenseSetupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { isLoaded, orgRole } = useClientAuthClaims();
  const isAdmin = orgRole === "org:admin";
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [expenseDate] = useState(todayDateKey);

  const handleSuccess = () => {
    formRef.current?.reset();
    setFormKey((key) => key + 1);
  };

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={addExpenseAction} onSuccess={handleSuccess} ref={formRef}>
        {({ loading }) => (
          <div className="space-y-6">
            <StandardHeader2
              buttonName="Save"
              withButton={isLoaded}
              title="Add Expense"
              description="Record a shop expense such as rent, utilities, or supplies."
              loading={loading}
              onCancel={() => router.back()}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ExpenseCategoryField key={formKey} />
              {isAdmin && (
                <StandardInput
                  name="expenseDate"
                  type="date"
                  label="Expense date"
                  defaultValue={expenseDate}
                  required
                />
              )}
              <StandardInput
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                required
              />
              <StandardInput
                name="notes"
                as="textarea"
                placeholder="Notes (optional)"
                className="rounded bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 shadow-lg ring-1 sm:col-span-2"
              />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
