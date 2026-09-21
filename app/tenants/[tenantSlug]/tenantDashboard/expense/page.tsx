import React from "react";
import ExpensesList from "@/features/expenses/components/ExpensesList";

const ExpensePage = () => {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 mt-10 mb-25">
      <ExpensesList />
    </main>
  );
};

export default ExpensePage;
