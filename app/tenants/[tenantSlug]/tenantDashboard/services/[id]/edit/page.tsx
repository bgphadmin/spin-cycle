import { getAuthContext } from "@/lib/auth";
import { getServiceByIdAction } from "@/features/services/actions/serviceActions";
import EditServiceForm from "@/features/services/components/EditServiceForm";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const { orgRole } = await getAuthContext();
  const service = await getServiceByIdAction(params.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 mt-10 mb-25">
      <EditServiceForm userRole={orgRole || ""} service={service} />;
    </main>
  )
}
