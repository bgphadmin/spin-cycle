import PettyCashList from "@/features/pettyCash/components/PettyCashList";
import { getPettyCashListDefaultsAction } from "@/features/pettyCash/actions/pettyCashActions";

export const dynamic = "force-dynamic";

export default async function PettyCashPage() {
  const initialRange = await getPettyCashListDefaultsAction();

  return (
    <main className="mx-auto mb-25 mt-10 w-full max-w-4xl px-6">
      <PettyCashList initialRange={initialRange} />
    </main>
  );
}
