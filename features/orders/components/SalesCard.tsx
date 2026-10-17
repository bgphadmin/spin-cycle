"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { CustomerSalesCard } from "@/features/orders/actions/getSalesAction";
import { toggleSalesPaymentAction } from "@/features/orders/actions/toggleSalesPaymentAction";
import { updateSalesPaymentMethodAction } from "@/features/orders/actions/updateSalesPaymentMethodAction";
import { useRouter } from "next/navigation";

export default function SalesCard({
  sale,
  onPaymentStatusChange,
}: {
  sale: CustomerSalesCard;
  onPaymentStatusChange?: (paid: boolean) => Promise<void>;
}) {
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(sale.isPaid);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethods.length === 1 ? sale.paymentMethods[0] : "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const printableReceiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => printableReceiptRef.current?.remove();
  }, []);

  useEffect(() => {
    setIsPaid(sale.isPaid);
    setPaymentMethod(sale.paymentMethods.length === 1 ? sale.paymentMethods[0] : "");
  }, [sale.isPaid, sale.paymentMethods]);

  function togglePayment() {
    setError(null);
    const nextPaid = !isPaid;
    setIsPaid(nextPaid);
    startTransition(async () => {
      try {
        const result = await toggleSalesPaymentAction(sale.orderIds);
        setIsPaid(result.paid);
        await onPaymentStatusChange?.(result.paid);
        router.refresh();
      } catch (actionError) {
        setIsPaid(!nextPaid);
        setError(actionError instanceof Error ? actionError.message : "Unable to update payment status.");
      }
    });
  }

  function changePaymentMethod(method: string) {
    setError(null);
    const previousMethod = paymentMethod;
    setPaymentMethod(method);
    startTransition(async () => {
      try {
        const result = await updateSalesPaymentMethodAction(sale.orderIds, method);
        setPaymentMethod(result.method);
        router.refresh();
      } catch (actionError) {
        setPaymentMethod(previousMethod);
        setError(actionError instanceof Error ? actionError.message : "Unable to update payment method.");
      }
    });
  }

  function printReceipt() {
    if (!receiptRef.current) return;
    const printedAt = new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: sale.timeZone,
    }).format(new Date());

    const printableReceipt = receiptRef.current.cloneNode(true) as HTMLDivElement;
    printableReceipt.dataset.printing = "true";
    const receiptDate = printableReceipt.querySelector(".thermal-receipt-date");
    if (receiptDate) receiptDate.textContent = `Date/Time: ${printedAt}`;
    printableReceiptRef.current?.remove();
    printableReceiptRef.current = printableReceipt;
    document.body.appendChild(printableReceipt);

    const cleanup = () => {
      printableReceipt.remove();
      if (printableReceiptRef.current === printableReceipt) printableReceiptRef.current = null;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  const subtotal = sale.machineGroups.reduce(
    (sum, group) => sum + group.lines.reduce((groupSum, line) => groupSum + line.total, 0),
    0,
  );
  const receiptPaymentMethod =
    paymentMethod === ""
      ? "Multiple methods"
      : paymentMethod === "UNPAID"
        ? "Unpaid"
        : paymentMethod === "EWALLET"
          ? "E-Wallet"
          : paymentMethod.charAt(0) + paymentMethod.slice(1).toLowerCase();

  return (
    <>
      <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between ${isPaid ? "bg-teal-100" : "bg-orange-100"}`}>
          <div>
            <h2 className="text-lg font-semibold text-teal-800">{sale.customerName}</h2>
            <p className="text-sm text-gray-500">
              {sale.orderTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)).join(", ")}
            </p>
            <p className="text-sm text-gray-500 mt-1">Handled by: {sale.handledByNames.join(", ")}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">Receipt: {sale.receiptNumber}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
            {sale.discountAmount > 0 && (
              <p className="text-xs text-gray-600">
                Discount: −₱{sale.discountAmount.toFixed(2)}
                {sale.discountNote ? ` · ${sale.discountNote}` : ""}
              </p>
            )}
            <p className="text-xl font-bold text-teal-700">₱{sale.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4 p-5 -mt-1 ">
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
            <label className="flex items-center gap-2">
              <span>Payment:</span>
              <select
                aria-label={`Payment method for ${sale.customerName}`}
                value={paymentMethod}
                onChange={(event) => changePaymentMethod(event.target.value)}
                disabled={isPending}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
              >
                {paymentMethod === "" && <option value="">Multiple methods</option>}
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="EWALLET">E-Wallet</option>
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={printReceipt}
                className="rounded-full border border-teal-700 px-3 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50"
              >
                Print receipt
              </button>
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
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </article>

      <div ref={receiptRef} className="thermal-receipt" aria-hidden="true">
        <header className="thermal-receipt-center">
          <strong className="thermal-receipt-shop-name">{sale.shopName}</strong>
          <p>RECEIPT</p>
        </header>
        <div className="thermal-receipt-rule" />
        <p className="thermal-receipt-date" />
        <p>Receipt: {sale.receiptNumber}</p>
        <p>Customer: {sale.customerName}</p>
        <p>Order: {sale.orderTypes.join(", ")}</p>
        <div className="thermal-receipt-rule" />
        {sale.machineGroups.map((group) => (
          <section key={group.machineName} className="thermal-receipt-group">
            <strong>{group.machineName}</strong>
            {group.lines.map((line) => (
              <div key={line.id} className="thermal-receipt-line">
                <div>
                  <p>{line.name}</p>
                  <p>{line.quantity} × ₱{line.price.toFixed(2)}</p>
                </div>
                <span>₱{line.total.toFixed(2)}</span>
              </div>
            ))}
          </section>
        ))}
        <div className="thermal-receipt-rule" />
        <div className="thermal-receipt-line">
          <span>Subtotal</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="thermal-receipt-line">
            <span>Discount{sale.discountNote ? ` (${sale.discountNote})` : ""}</span>
            <span>-₱{sale.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="thermal-receipt-line thermal-receipt-total">
          <strong>Total</strong>
          <strong>₱{sale.total.toFixed(2)}</strong>
        </div>
        <p>Payment: {receiptPaymentMethod}</p>
        <p>Status: {isPaid ? "Paid" : "Not paid"}</p>
        <div className="thermal-receipt-rule" />
        <p className="thermal-receipt-center">Thank you!</p>
      </div>
    </>
  );
}
