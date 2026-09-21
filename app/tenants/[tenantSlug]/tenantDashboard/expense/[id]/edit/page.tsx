import { getExpenseByIdAction } from "@/features/expenses/actions/expenseActions";
import EditExpenseForm from "@/features/expenses/components/EditExpenseForm";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const expense = await getExpenseByIdAction(params.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 mt-10 mb-25">
      <EditExpenseForm expense={expense} />
    </main>
  );
}
