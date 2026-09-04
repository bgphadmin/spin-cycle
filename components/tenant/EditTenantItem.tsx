"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // shadcn/ui import
import LoadingButton from "../utils/LoadingButton";
import toast from "react-hot-toast";
import { useState } from "react";
import LoadingDeleteButton from "@/components/utils/LoadingDeleteButton";
import { revalidatePath } from "next/cache";
import { ConfirmDeleteDialog } from "@/components/utils/ConfirmDeleteDialog";
import { deleteTenantItemAction, editTenantAction } from "@/utils/actions/tenant/tenantAction";
import { TenantRow } from "./TenantGrid";
import type { Tenant } from "@prisma/client";
import { Input } from "../ui/input";

// #TODO: Hello

export function EditTenantItem({
    item,
    open,
    onOpenChange,
    onEditSuccess,
    onDeleteSuccess,
}: {
    item: {
        id: string;
        shopName: string;
        address: string;
        contactPerson: string;
        contactPosition: string | null;
        phone: string;
        email: string | null;
        subscriptionStatus: string;
        createdAt: Date;
    },
    open: boolean,
    onOpenChange: (open: boolean) => void, showTrigger?: boolean,
    onEditSuccess?: (updated: TenantRow) => void,
    onDeleteSuccess?: (deleteId: string) => void,
}) {

    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setSaving(true);
        const result = await editTenantAction(item.id, formData);
        const parsedMessage = JSON.parse(result.message);

        if (parsedMessage.length == 3 && parsedMessage[1].result == 'success') {
            toast.success(parsedMessage[0].message);
            const updatedRow: TenantRow = {
                ...item,
                shopName: formData.get("shopName") as string,
                address: formData.get("address") as string,
                contactPerson: formData.get("contactPerson") as string,
                contactPosition: formData.get("contactPosition") as string,
                phone: formData.get("phone") as string,
                email: formData.get("email") as string,
                subscriptionStatus: formData.get("subscriptionStatus") as Tenant["subscriptionStatus"],
                createdAt: new Date(item.createdAt),
            };
            onOpenChange(false);
            onEditSuccess?.(updatedRow);
            revalidatePath("/dashboard/tenants");
        } else {
            toast.error(parsedMessage[0].message);
        }
        setSaving(false);
    }

    const handleDelete = async () => {
        setDeleting(true);
        const result = await deleteTenantItemAction(item.id);
        const parsedMessage = JSON.parse(result.message);
        if (parsedMessage[1].result === "success") {
            toast.success(parsedMessage[0].message);
            onOpenChange(false);
            // Instead of updated row, you may want to trigger a refresh in parent
            onDeleteSuccess?.(item.id);
        } else {
            toast.error(parsedMessage[0].message);
        }
        setDeleting(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>

            <AlertDialogContent className="bg-orange-50 border border-gray-200 text-teal-900 rounded-xl p-6 shadow-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-teal-900">Update Tenant</AlertDialogTitle>
                </AlertDialogHeader>
                <form action={handleSubmit}>
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Shop Name
                                </label>
                                <Input
                                    type="text"
                                    name="shopName"
                                    defaultValue={item.shopName}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Contact Person
                                </label>
                                <Input
                                    type="text"
                                    name="contactPerson"
                                    defaultValue={item.contactPerson}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Contact Position
                                </label>
                                <Input
                                    type="text"
                                    name="contactPosition"
                                    defaultValue={item.contactPosition || ""}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Address
                                </label>
                                <Input
                                    type="text"
                                    name="address"
                                    defaultValue={item.address}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Phone
                                </label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    defaultValue={item.phone}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    defaultValue={item.email || ""}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2 pb-4">
                                <label className="text-sm font-medium text-foreground">Status</label>
                                <select
                                    name="subscriptionStatus"
                                    defaultValue={item.subscriptionStatus}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                                >
                                    <option value="REGULAR">REGULAR</option>
                                    <option value="PREMIUM">PREMIUM</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>
                        </div>
                        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-2">
                            <AlertDialogCancel className="rounded bg-orange-100  px-3 py-5 text-sm  hover:bg-orange-200 cursor-pointer">
                                Cancel
                            </AlertDialogCancel>
                            <LoadingButton
                                loading={saving}
                                type="submit"
                                className="rounded bg-orange-400 px-4 py-2 text-sm text-teal-50 hover:bg-orange-500 cursor-pointer"
                            >
                                Save
                            </LoadingButton>
                            <ConfirmDeleteDialog
                                itemName={item.shopName}
                                deleting={deleting}
                                onDelete={handleDelete}
                                trigger={
                                    <LoadingDeleteButton
                                        loading={deleting}
                                        type="button"
                                        className="rounded bg-red-600 px-4 py-3 text-sm text-white hover:bg-red-700 cursor-pointer"
                                    >
                                        Delete
                                    </LoadingDeleteButton>
                                }
                            />
                        </AlertDialogFooter>
                    </>
                </form>

            </AlertDialogContent>

        </AlertDialog>
    );
}