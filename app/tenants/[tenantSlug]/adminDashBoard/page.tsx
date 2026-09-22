import AdminSalesAnalytics from "@/features/orders/components/AdminSalesAnalytics";
import AdminFinancialSummary from "@/features/orders/components/AdminFinancialSummary";
import { getAdminSalesAnalyticsAction } from "@/features/orders/actions/getAdminSalesAnalyticsAction";

const OwnerDashBoardPage = async () => {
  const analytics = await getAdminSalesAnalyticsAction();

  return (
    <main className="mx-auto mb-24 w-full max-w-6xl  px-4 py-8 sm:px-6">
      <div className="mb-6 mx-10">
        <h1 className="text-3xl font-bold text-teal-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Paid sales analytics for the last year and year to date.</p>
      </div>
      <AdminFinancialSummary analytics={analytics} />
      <AdminSalesAnalytics analytics={analytics} />
    </main>
  )
}

export default OwnerDashBoardPage
