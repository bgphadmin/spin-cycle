import NotAllowed from "@/app/not-allowed";
import ServiceSetupForm from "@/features/services/components/ServiceSetupForm";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";

export default async function ServiceSetupPage() {
  const { orgRole } = await getServerAuthClaims();

  if (orgRole !== "org:admin") {
    return <NotAllowed />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-0 mb-24">
      <ServiceSetupForm />
    </main>
  );
}
