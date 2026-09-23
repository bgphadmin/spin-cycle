"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/custom/DeleteButton";
import { DeleteConfirmationDialog } from "@/components/ui/custom/DeleteConfirmationDialog";
import toast from "react-hot-toast";
import AdminOrderEditModal from "@/features/orders/components/AdminOrderEditModal";
import {
  deleteAdminOrderAction,
  getAdminOrdersAction,
  type AdminOrderRow,
} from "@/features/orders/actions/adminOrderActions";

function dateKey(value: string) {
  return value.slice(0, 10);
}

function money(value: number) {
  return `₱${value.toFixed(2)}`;
}

function todayDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const ROWS_PER_PAGE = 10;

export default function AdminOrderManagement({ orders }: { orders: AdminOrderRow[] }) {
  const [currentOrders, setCurrentOrders] = useState(orders);
  const [customerSearch, setCustomerSearch] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [fromDate, setFromDate] = useState(todayDateKey);
  const [toDate, setToDate] = useState(todayDateKey);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrderRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(async () => setCurrentOrders(await getAdminOrdersAction()));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.set("orderId", deleteTarget.id);
      const result = await deleteAdminOrderAction(null, formData);
      const messages = JSON.parse(result.message) as Array<{ message?: string; result?: string }>;
      const successMessage = messages[0]?.message ?? "Order deleted successfully.";
      if (messages[0]?.result !== "success") throw new Error(successMessage);
      toast.success(successMessage);
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete order.");
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const customerQuery = customerSearch.trim().toLowerCase();
    const receiptQuery = receiptSearch.trim().toLowerCase();
    return currentOrders.filter((order) => {
      const orderDate = dateKey(order.createdAt);
      return (
        (!customerQuery || order.customerName.toLowerCase().includes(customerQuery)) &&
        (!receiptQuery || order.receiptNumber.toLowerCase().includes(receiptQuery)) &&
        (!fromDate || orderDate >= fromDate) &&
        (!toDate || orderDate <= toDate)
      );
    });
  }, [currentOrders, customerSearch, receiptSearch, fromDate, toDate]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ROWS_PER_PAGE));
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  function changeFilter(setter: (value: string) => void, value: string) {
    setCurrentPage(1);
    setter(value);
  }

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function openOrderEditor(orderId: string) {
    setEditingId(orderId);
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          value={customerSearch}
          onChange={(event) => changeFilter(setCustomerSearch, event.target.value)}
          placeholder="Search customer name..."
          aria-label="Search orders by customer name"
        />
        <Input
          value={receiptSearch}
          onChange={(event) => changeFilter(setReceiptSearch, event.target.value)}
          placeholder="Search receipt number..."
          aria-label="Search orders by receipt number"
        />
        <Input type="date" value={fromDate} onChange={(event) => changeFilter(setFromDate, event.target.value)} aria-label="Orders from date" />
        <Input type="date" value={toDate} onChange={(event) => changeFilter(setToDate, event.target.value)} aria-label="Orders to date" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredOrders.length} of {currentOrders.length} orders
        </p>
        {isRefreshing && <span className="text-sm text-gray-500">Refreshing...</span>}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="bg-teal-100 p-4 text-lg font-semibold text-teal-700">Order records</h2>
        {currentOrders.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">Click a row to edit the laundry order.</p>
        )}
        {filteredOrders.length === 0 ? (
          <p className="mt-4 text-center text-sm text-gray-500">No orders match these filters.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Receipt</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrderEditor(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openOrderEditor(order.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer border-b border-gray-100 align-top last:border-0 hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                  >
                    <td className="px-3 py-3 text-gray-600">
                      {new Date(order.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-800">{order.customerName}</td>
                    <td className="px-3 py-3 text-gray-600">{order.receiptNumber}</td>
                    <td className="px-3 py-3 text-gray-600">{order.status.replace("_", " ")}</td>
                    <td className="px-3 py-3 font-medium text-teal-700">{money(order.total)}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {order.paid ? `Paid${order.paymentMethod ? ` (${order.paymentMethod})` : ""}` : "Unpaid"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <DeleteButton
                        loading={isDeleting && deleteTarget?.id === order.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(order);
                        }}
                        className="px-3 py-1.5 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}-
                  {Math.min(currentPage * ROWS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="standard_sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        loading={isDeleting}
        message={
          deleteTarget
            ? `Deleting the laundry order for ${deleteTarget.customerName} cannot be undone.`
            : "Deleting this laundry order cannot be undone."
        }
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
      {editingId && <AdminOrderEditModal orderId={editingId} onClose={() => setEditingId(null)} onSuccess={() => { setEditingId(null); refresh(); }} />}
    </section>
  );
}
