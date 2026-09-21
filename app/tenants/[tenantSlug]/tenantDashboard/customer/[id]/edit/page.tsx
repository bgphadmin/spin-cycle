import EditCustomerForm from "@/features/customers/components/EditCustomerForm";
import { getCustomerByIdAction } from "@/features/customers/actions/customerActions";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customer = await getCustomerByIdAction(params.id);
  return (
    <main className="mx-auto mb-24 w-full max-w-3xl px-6">
      <EditCustomerForm customer={customer} />
    </main>
  );
}
