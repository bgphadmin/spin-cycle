import { getTodaySalesAction } from "@/features/orders/actions/getSalesAction";
import { getSalesSummaryAction } from "@/features/orders/actions/getSalesSummaryAction";
import SalesTabs from "@/features/orders/components/SalesTabs";

export default async function SalesPage() {
    const [sales, summary] = await Promise.all([getTodaySalesAction(), getSalesSummaryAction()]);

    return (
        <main className="mx-auto mb-24 w-full max-w-6xl px-4 py-8 sm:px-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-teal-800">Today&apos;s Sales</h1>
                <p className="mt-1 text-sm text-gray-500">Orders grouped by customer.</p>
            </div>
            <SalesTabs sales={sales} summary={summary} />
        </main>
    )
}
