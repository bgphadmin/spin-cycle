import { getPettyCashByIdAction } from "@/features/pettyCash/actions/pettyCashActions";
import EditPettyCashForm from "@/features/pettyCash/components/EditPettyCashForm";

export const dynamic = "force-dynamic";

export default async function EditPettyCashPage({ params }: { params: { id: string } }) {
  const entry = await getPettyCashByIdAction(params.id);

  return (
    <main className="mx-auto mb-25 mt-10 w-full max-w-3xl px-6">
      <EditPettyCashForm entry={entry} />
    </main>
  );
}
