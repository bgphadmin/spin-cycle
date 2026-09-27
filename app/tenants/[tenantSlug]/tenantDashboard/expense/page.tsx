import React from "react";
import { getExpenseListDefaultsAction } from "@/features/expenses/actions/expenseActions";
import ExpensesList from "@/features/expenses/components/ExpensesList";

const ExpensePage = async () => {
  const initialRange = await getExpenseListDefaultsAction();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 mt-10 mb-25">
      <ExpensesList initialRange={initialRange} />
    </main>
  );
};

export default ExpensePage;
