import RegisterShopForm from "@/features/registerShop/components/RegisterShopForm";
import db from '@/utils/db'
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { redirect } from "next/navigation";

export default async function RegisterShopPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 m-12">
      <RegisterShopForm />
    </main>
  );
}
