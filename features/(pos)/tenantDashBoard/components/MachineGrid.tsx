"use client";

import { useEffect, useState } from "react";
import { getMachinesAction } from "@/features/machines/actions/getMachinesAction";
import  MachineCard  from "./MachineCard"; // your card component
import { LaundryOrderStatus, Machine } from "@prisma/client";

type MachineStatus = "AVAILABLE" | "IN_USE" | "UNAVAILABLE";

export default function MachinesGrid() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMachines = async () => {
      const result = await getMachinesAction();
      if ("machines" in result) {
        setMachines(result.machines as Machine[]);
      }
      setLoading(false);
    };
    loadMachines();
  }, []);

  if (loading) return <p>Loading machines...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {machines.map((machine) => (
        <MachineCard
          key={machine.id}
          id={machine.id}
          name={machine.name}
          type={machine.type}
          status={machine.status as MachineStatus}
          usageCount={machine.usageCount}
        />
      ))}
    </div>
  );
}