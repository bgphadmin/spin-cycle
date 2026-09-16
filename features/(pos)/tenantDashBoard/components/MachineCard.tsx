'use client'

import Image from "next/image";
import { useState } from "react";
import OrderModal from "../../../orders/components/OrderModal";

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

  let imageSrc = "/washer.png"
  if (type === "washer" && status !== "UNAVAILABLE") {
    imageSrc = "/washer.png"
  } else if (type === "dryer" && status !== "UNAVAILABLE") {
    imageSrc = "/dryer.png"
  } else {
    imageSrc = "/washer_ua.png"
  }

  const isInUse = status === "IN_USE";

  return (
    <div
      className="rounded bg-card shadow-sm p-4 cursor-pointer hover:shadow-lg transition flex flex-col items-center"
      onClick={() => setOpen(true)}
    >
      {/* Machine image with shake animation */}
      <Image
        src={imageSrc}
        alt={name}
        width={120}
        height={120}
        className={`mb-3 ${isInUse ? "animate-shake" : ""}`}
      />

      {/* Machine info */}
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground capitalize">{type}</p>
      <p className="text-sm">Status: {status}</p>
      <p className="text-sm">Usage Count: {usageCount}</p>

      {open && (
        <OrderModal
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