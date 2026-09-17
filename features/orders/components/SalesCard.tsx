"use client";

import { useEffect, useState, useTransition } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import { toggleSalesPaymentAction } from "@/features/orders/actions/toggleSalesPaymentAction";
import { useRouter } from "next/navigation";

function formatPaymentMethod(method: string) {
  return method === "EWALLET" ? "E-Wallet" : method.charAt(0) + method.slice(1).toLowerCase();
}

export default function SalesCard({ sale }: { sale: CustomerSalesCard }) {
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(sale.isPaid);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsPaid(sale.isPaid);
  }, [sale.isPaid]);

  function togglePayment() {
    setError(null);
    const nextPaid = !isPaid;
    setIsPaid(nextPaid);
    startTransition(async () => {
      try {
        const result = await toggleSalesPaymentAction(sale.orderIds);
        setIsPaid(result.paid);
        router.refresh();
      } catch (actionError) {
        setIsPaid(!nextPaid);
        setError(actionError instanceof Error ? actionError.message : "Unable to update payment status.");
      }
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between ${isPaid ? "bg-teal-100" : "bg-orange-100"}`}>
        <div>
          <h2 className="text-lg font-semibold text-teal-800">{sale.customerName}</h2>
          <p className="text-sm text-gray-500">
            {sale.orderTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(", ")}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
          <p className="text-xl font-bold text-teal-700">₱{sale.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-4 p-5 pt-0">
        {sale.machineGroups.map((group) => (
          <section key={group.machineName}>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">{group.machineName}</h3>
            <div className="space-y-2">
              {group.lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{line.name}</p>
                    <p className="text-xs text-gray-500">
                      {line.kind} · {line.quantity} × ₱{line.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium text-gray-700">₱{line.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-gray-200 px-5 pb-5 pt-3 text-sm text-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Payment: {sale.paymentMethods.map(formatPaymentMethod).join(", ")}</span>
          <button
            type="button"
            onClick={togglePayment}
            disabled={isPending}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white transition disabled:cursor-wait disabled:opacity-60 ${
              isPaid ? "bg-teal-600 hover:bg-teal-700" : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isPending ? "Updating..." : isPaid ? "Paid" : "Not Paid"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </article>
  );
}
