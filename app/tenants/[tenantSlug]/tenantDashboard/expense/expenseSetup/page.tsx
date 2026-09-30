import ExpenseSetupForm from "@/features/expenses/components/ExpenseSetupForm";
import { getExpenseListDefaultsAction } from "@/features/expenses/actions/expenseActions";

export default async function ExpenseSetupPage() {
  const { endDate } = await getExpenseListDefaultsAction();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-0 mb-24">
      <ExpenseSetupForm initialExpenseDate={endDate} />
    </main>
  );
}
