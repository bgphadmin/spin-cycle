
export type MachineProps = {
  id: string;
  type: "washer" | "dryer";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PAID";
};

export function MachineCard({ type, status }: MachineProps) {
  const statusColors: Record<MachineProps["status"], string> = {
    PENDING: "bg-gray-400",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500",
    PAID: "bg-teal-500",
  };

  const isActive = status === "IN_PROGRESS";

  return (
    <div
      className={`flex flex-col items-center p-4 rounded-lg shadow-sm ${
        isActive ? "animate-shake" : ""
      }`}
    >
      {/* Show image always, but animate when active */}
      <img
        src={type === "washer" ? "/washer.png" : "/dryer.png"}
        alt={type}
        className={`w-24 sm:w-32 md:w-40 h-auto ${
          isActive
            ? type === "washer"
              ? "animate-shake" // washer drum spins
              : "animate-pulse" // dryer glows/pulses
            : ""
        }`}
      />

      {/* Status badge */}
      <span
        className={`mt-2 px-3 py-1 text-sm font-semibold text-white rounded-full ${statusColors[status]}`}
      >
        {status}
      </span>
    </div>
  );
}