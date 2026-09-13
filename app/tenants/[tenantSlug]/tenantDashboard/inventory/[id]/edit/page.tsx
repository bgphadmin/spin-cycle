import { getAuthContext } from "@/lib/auth";
import { getInventoryItemByIdAction } from "@/features/inventory/actions/inventoryActions";
import EditInventoryItemForm from "@/features/inventory/components/EditInventoryItemForm";

export default async function EditInventoryItemPage({ params }: { params: { id: string } }) {
  const { orgRole } = await getAuthContext();
  const item = await getInventoryItemByIdAction(params.id);
  return <EditInventoryItemForm userRole={orgRole || ""} item={item} />;
}
