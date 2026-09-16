import { getAuthContext } from "@/lib/auth";
import { getInventoryItemByIdAction } from "@/features/inventory/actions/inventoryActions";
import EditInventoryItemForm from "@/features/inventory/components/EditInventoryItemForm";

export default async function EditInventoryItemPage({ params }: { params: { id: string } }) {
  const { orgRole } = await getAuthContext();
  const item = await getInventoryItemByIdAction(params.id);
  return (
    <main className="mx-auto w-full max-w-3xl px-6 mt-10 mb-25">
      <EditInventoryItemForm userRole={orgRole || ""} item={item} />;
    </main>
  )


}
