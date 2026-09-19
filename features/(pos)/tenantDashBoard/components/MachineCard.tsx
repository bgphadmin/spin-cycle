'use client'

import Image from "next/image";
import { useEffect, useState } from "react";
import OrderModal from "../../../orders/components/OrderModal";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import LoadingDeleteButton from "@/components/utils/LoadingDeleteButton";
import { cancelOrderAction, completeOrderAction, getActiveOrderAction } from "../actions/orderActions";

type MachineCardProps = {
  id: string;
  name: string;
  type: "washer" | "dryer";
  status: "AVAILABLE" | "IN_USE" | "UNAVAILABLE";
  usageCount: number;
  onOrderCreated: () => Promise<void>;
};

export default function MachineCard({ id, name, type, status, usageCount, onOrderCreated }: MachineCardProps) {
  const [open, setOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);

  let imageSrc = "/washer.png"
  if (type === "washer" && status !== "UNAVAILABLE") {
    imageSrc = "/washer.png"
  } else if (type === "dryer" && status !== "UNAVAILABLE") {
    imageSrc = "/dryer.png"
  } else {
    imageSrc = "/washer_ua.png"
  }

  const isInUse = status === "IN_USE";
  const isUnavailable = status === "UNAVAILABLE";

  useEffect(() => {
    if (!isInUse) {
      setActiveOrderId(null);
      return;
    }
    let cancelled = false;
    async function loadActiveOrder() {
      const order = await getActiveOrderAction(id);
      if (!cancelled) setActiveOrderId(order?.id ?? null);
    }
    void loadActiveOrder();
    return () => {
      cancelled = true;
    };
  }, [id, isInUse]);

  const handleCancelOrder = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!activeOrderId) return;
    setCancelling(true);
    try {
      await cancelOrderAction(activeOrderId);
      await onOrderCreated();
    } finally {
      setCancelling(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!activeOrderId) return;
    setCompleting(true);
    try {
      await completeOrderAction(activeOrderId);
      await onOrderCreated();
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`rounded bg-card shadow-sm p-4 transition flex flex-col items-center ${isUnavailable ? "cursor-default" : "cursor-pointer hover:shadow-lg"
        }`}
      onClick={isUnavailable ? undefined : () => setOpen(true)}
    >
      {/* Machine image with shake animation, flanked by Cancel/Complete when in use */}
      <div className="mb-3 flex w-full items-center justify-center gap-3">
        {isInUse && activeOrderId && (
          <LoadingDeleteButton
            loading={cancelling}
            disabled={completing}
            type="button"
            onClick={handleCancelOrder}
            className="shrink-0 rounded bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
          >
            Cancel
          </LoadingDeleteButton>
        )}

        <Image
          src={imageSrc}
          alt={name}
          width={120}
          height={120}
          className={isInUse ? "animate-shake" : ""}
        />

        {isInUse && activeOrderId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <LoadingDeleteButton
                loading={completing}
                disabled={cancelling}
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="shrink-0 rounded bg-teal-500 px-3 py-2 text-xs text-white hover:bg-teal-600 disabled:opacity-50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
              >
                Complete
              </LoadingDeleteButton>
            </AlertDialogTrigger>
            <AlertDialogContent
              className="bg-white border border-gray-200 rounded-lg p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold text-teal-600">
                  Confirm Completion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-500">
                  Are you sure you want to complete the laundry order on <strong>{name}</strong>? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row gap-2">
                <AlertDialogCancel className="flex-1 h-11 rounded-md bg-slate-500 px-6 py-2 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <LoadingDeleteButton
                  onClick={handleCompleteOrder}
                  loading={completing}
                  type="button"
                  className="flex-1 h-11 rounded-md bg-teal-500 text-white hover:bg-teal-600"
                >
                  Yes, Complete
                </LoadingDeleteButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Machine info */}
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground capitalize">{type}</p>
      <p className="text-sm">Status: {status}</p>
      <p className="text-sm">Usage Count: {usageCount}</p>

      {open && (
        <OrderModal
          name={name}
          machineId={id}
          type={type}
          status={status}
          onClose={() => {
            setOpen(false);
            void onOrderCreated();
          }}
        />
      )}
    </div>
  );
}