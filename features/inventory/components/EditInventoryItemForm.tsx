"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { useDeleteAction } from "@/utils/hooks/useDeleteAction";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";
import { Loader2 } from "lucide-react";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import NotAllowed from "@/app/not-allowed";
import { InventoryItem } from "../types/inventoryTypes";
import { deleteInventoryItemAction, updateInventoryItemAction } from "../actions/inventoryActions";

export default function EditInventoryItemForm({
  userRole,
  item,
}: {
  userRole: string;
  item: InventoryItem | null;
}) {
  const router = useRouter();
  const {
    onDelete,
    confirmDelete,
    cancelDelete,
    confirmationMessage,
    isConfirmationOpen,
    loading: deleteLoading,
  } = useDeleteAction(deleteInventoryItemAction, {
    successMessage: "Inventory item deleted successfully",
    redirectTo: "../",
    confirmationMessage: `Deleting inventory item ${item?.name} cannot be undone!`,
  });

  if (!item) return <div>Inventory item not found</div>;
  if (userRole !== "org:admin") return <NotAllowed />;

  return (
    <div className="max-h-[94vh] flex items-start justify-center bg-white px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
      <FormContainer action={updateInventoryItemAction} onSuccess={() => router.push("../")}>
        {({ loading }) => (
          <div className="space-y-6">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <StandardFormTitle title="Edit Inventory Item" description="Update or delete this inventory item." />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={loading} variant="standard">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                </Button>
                <DeleteButton loading={deleteLoading} onClick={onDelete} />
                <DeleteConfirmationDialog open={isConfirmationOpen} loading={deleteLoading} message={confirmationMessage} onCancel={cancelDelete} onConfirm={confirmDelete} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={item.id} />
              <StandardInput name="name" placeholder="Item Name" defaultValue={item.name} required />
              <StandardRadioGroup
                name="type"
                label="Type"
                required
                defaultValue={item.type}
                options={[
                  { value: "retail", label: "Retail" },
                  { value: "consumable", label: "Consumable" },
                ]}
              />
              <StandardInput name="unit" placeholder="Unit" defaultValue={item.unit} required />
              <StandardInput name="stock" type="number" min="0" step="1" placeholder="Stock" defaultValue={item.stock} required />
              <StandardInput name="threshold" type="number" min="0" step="1" placeholder="Low-stock threshold" defaultValue={item.threshold} required />
              <StandardInput name="price" type="number" min="0" step="0.01" placeholder="Price" defaultValue={item.price} required />
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}
