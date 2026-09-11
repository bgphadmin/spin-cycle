"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FormContainer from "@/components/utils/FormContainer";
import { StandardFormTitle } from "@/components/ui/custom/StandardTitle";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { Loader2 } from "lucide-react";
import { updateMachineAction, deleteMachineAction, getMachineByIdAction } from "@/features/machines/actions/machineActions";
import { StandardRadioGroup } from "@/components/ui/custom/StandardRadioGroup";

export default async function EditMachinePage({ params }: { params: { id: string } }) {
    const router = useRouter();

    // Prefill machine data
    const machine = await getMachineByIdAction(params.id);

    return (
        <div className="max-h-[94vh] flex items-start justify-center bg-white
     px-4 sm:px-6 lg:px-8 shadow-2xl rounded-lg pt-12 mt-8 pb-34 mb-4">
            <FormContainer
                action={updateMachineAction}
                onSuccess={() => router.push("../")}
            >
                {({ loading }) => (
                    <div className="space-y-6">
                        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <StandardFormTitle
                                title="Edit Machine"
                                description="Update or delete this machine record."
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    variant="standard"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update"}
                                </Button>
                                <FormContainer action={deleteMachineAction} onSuccess={() => router.push("/machines")}>
                                    {({ loading }) => (
                                        <>
                                            <input type="hidden" name="id" value={params.id} />
                                            <Button type="submit" variant="destructive" disabled={loading}>
                                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                                            </Button>
                                        </>
                                    )}
                                </FormContainer>
                            </div>
                        </div>

                        <div className="mx-auto h-0.5 bg-gray-300 shadow-inner rounded-full" />

                        <div className="grid gap-5 sm:grid-cols-2">
                            <input type="hidden" name="id" value={machine?.id} />
                            <StandardInput name="name" placeholder="Machine Name" defaultValue={machine?.name} required />
                            <StandardRadioGroup
                                name="type"
                                label="Type"
                                required
                                options={[
                                    { value: "washer", label: "Washer" },
                                    { value: "dryer", label: "Dryer" },
                                ]}
                                defaultValue={machine?.type} // preselect current type
                            />
                            <StandardInput name="status" placeholder="Status" defaultValue={machine?.status} required />
                            <StandardInput name="usageCount" placeholder="Usage Count" type="number" defaultValue={machine?.usageCount} />
                            <div className="sm:col-span-2">
                                <StandardInput name="location" placeholder="Location" defaultValue={machine?.location ?? ""} />
                            </div>
                            <div className="sm:col-span-2">
                                <StandardInput name="comment" placeholder="Comment" as="textarea" defaultValue={machine?.comment ?? ""} />
                            </div>
                        </div>
                    </div>
                )}
            </FormContainer>
        </div>
    );
}