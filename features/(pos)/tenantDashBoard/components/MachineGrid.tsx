import { MachineCard } from "./MachineCard";

type Machine = {
  id: string;
  type: "washer" | "dryer";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID";
};

type Props = {
  machines: Machine[];
};

export function MachineGrid({ machines }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-4 lg:ml-30">
      {machines.map((m) => (
        <MachineCard key={m.id} {...m} />
      ))}
    </div>
  );
}