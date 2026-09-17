import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";

function formatPaymentMethod(method: string) {
  return method === "EWALLET" ? "E-Wallet" : method.charAt(0) + method.slice(1).toLowerCase();
}

export default function SalesCard({ sale }: { sale: CustomerSalesCard }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
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

      <div className="mt-4 space-y-4">
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

      <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-600">
        Payment: {sale.paymentMethods.map(formatPaymentMethod).join(", ")}
      </div>
    </article>
  );
}
