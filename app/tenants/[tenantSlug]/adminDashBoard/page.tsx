import { getAdminSalesAnalyticsAction } from "@/features/orders/actions/getAdminSalesAnalyticsAction";
import { getAdminOrdersAction } from "@/features/orders/actions/adminOrderActions";
import AdminDashboardTabs from "@/features/orders/components/AdminDashboardTabs";
import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";

const OwnerDashBoardPage = async () => {
  const { orgRole } = await getAuthContext();
  if (orgRole !== "org:admin") redirect("/not-allowed");

  const [analytics, orders] = await Promise.all([
    getAdminSalesAnalyticsAction(),
    getAdminOrdersAction(),
  ]);

  return (
    <main className="mx-auto mb-24 w-full max-w-6xl  px-4 py-8 sm:px-6">
      <div className="mb-6 mx-10">
        <h1 className="text-3xl font-bold text-teal-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Paid sales analytics for the last year and year to date.</p>
      </div>
      <AdminDashboardTabs analytics={analytics} orders={orders} />
    </main>
  )
}

export default OwnerDashBoardPage
