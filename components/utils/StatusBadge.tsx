import { Badge } from "../ui/badge";

export default function StatusBadge({ status }: { status: string }) {
    const norm = status.toLowerCase();
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

    if (norm.includes("active") || norm.includes("running") || norm.includes("idle"))
        variant = "secondary";
    if (norm.includes("maintenance") || norm.includes("broken") || norm.includes("error"))
        variant = "destructive";
    if (norm.includes("ready") || norm.includes("available")) variant = "default";

    return (
        <Badge variant={variant} className="capitalize font-medium shadow-sm">
            {status}
        </Badge>
    );
}