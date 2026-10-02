import PettyCashSetupForm from "@/features/pettyCash/components/PettyCashSetupForm";
import { getPettyCashListDefaultsAction } from "@/features/pettyCash/actions/pettyCashActions";

export const dynamic = "force-dynamic";

export default async function PettyCashSetupPage() {
  const { endDate } = await getPettyCashListDefaultsAction();

  return (
    <main className="mx-auto mb-24 w-full max-w-3xl px-6">
      <PettyCashSetupForm initialCashDate={endDate} />
    </main>
  );
}
