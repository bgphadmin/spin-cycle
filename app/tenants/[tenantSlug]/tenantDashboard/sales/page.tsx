import { getTodaySalesAction } from "@/features/orders/actions/getSalesAction";
import SalesCard from "@/features/orders/components/SalesCard";

export default async function SalesPage() {
    const sales = await getTodaySalesAction();

    return (
        <main className="mx-auto mb-24 w-full max-w-6xl px-4 py-8 sm:px-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-teal-800">Today&apos;s Sales</h1>
                <p className="mt-1 text-sm text-gray-500">Orders grouped by customer.</p>
            </div>
            {sales.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                    No sales recorded today.
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2">
                    {sales.map((sale) => (
                        <SalesCard key={sale.customerId} sale={sale} />
                    ))}
                </div>
            )}
        </main>
    )
}
