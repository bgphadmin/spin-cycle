import { getMachineByIdAction } from "@/features/machines/actions/machineActions";
import EditMachineForm from "@/features/machines/components/EditMachineForm";
import { getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditMachinePage({ params }: { params: { id: string } }) {
    const { orgRole } = await getAuthContext();
    const machineData = await getMachineByIdAction(params.id);

    return (
        <EditMachineForm
            key={machineData ? `${machineData.id}-${machineData.status}` : "machine-not-found"}
            userRole={orgRole || ""}
            machine={machineData}
        />
    );
}
