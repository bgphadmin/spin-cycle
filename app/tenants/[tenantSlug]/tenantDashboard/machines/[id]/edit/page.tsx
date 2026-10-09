import { getMachineByIdAction } from "@/features/machines/actions/machineActions";
import EditMachineForm from "@/features/machines/components/EditMachineForm";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditMachinePage({ params }: { params: { id: string } }) {
    const { orgRole } = await getAuthContext();
    const machineData = await getMachineByIdAction(params.id);

    return (
        <main className="mx-auto w-full max-w-3xl min-w-0 px-3 pb-24 pt-4 sm:px-6 sm:pb-28 sm:pt-10">
            <EditMachineForm
                key={
                    machineData && "id" in machineData
                        ? `${machineData.id}-${machineData.status}`
                        : "machine-not-found"
                }
                userRole={orgRole || ""}
                machine={machineData && "id" in machineData ? machineData : null}
            />
        </main>
    );
}
