import NotAllowed from "@/app/not-allowed";
import InventoryItemSetupForm from "@/features/inventory/components/InventoryItemSetupForm";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

export default async function InventoryItemSetupPage() {
  const { orgRole } = await getServerAuthClaims();

  if (orgRole !== "org:admin") return <NotAllowed />;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-0 mb-24">
      <InventoryItemSetupForm />
    </main>
  );
}
