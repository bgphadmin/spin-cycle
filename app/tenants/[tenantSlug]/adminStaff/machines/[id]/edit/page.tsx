import { getMachineByIdAction } from "@/features/machines/actions/machineActions";
import EditMachineForm from "@/features/machines/components/EditMachineForm";
import { getAuthContext } from "@/lib/auth";

export default async function EditMachinePage({ params }: { params: { id: string } }) {
    const { orgRole } = await getAuthContext();
    const machineData = await getMachineByIdAction(params.id);

    return <EditMachineForm userRole={orgRole || ""} machine={machineData} />;
}
