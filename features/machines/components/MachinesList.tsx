"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    MapPin,
    Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { getMachinesAction } from "@/features/machines/actions/getMachinesAction";
import ViewToggle from "@/components/utils/ToggleView";
import SkeletonTable from "@/components/utils/SkeletonTable";
import StatusBadge from "@/components/utils/StatusBadge";
import { EmptyState } from "@/components/utils/EmptyState";
import { StandardTableHeader } from "@/components/utils/StandardTableHeader";
import { Machine } from "../types/machineTypes";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { useRouter } from "next/navigation";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";

export default function MachinesList() {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"table" | "cards">("table");
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter();

    useEffect(() => {
        const loadMachines = async () => {
            const result = await getMachinesAction();
            if ("machines" in result) {
                setMachines(result.machines as Machine[]);
            }
            setLoading(false);
        };
        loadMachines();

        const setRole = async () => {
            const { orgRole } = await getServerAuthClaims()
            if (orgRole === "org:admin") {
                setIsAdmin(true)
            }
        }
        setRole();
    }, []);

    return (
        <div className="mt-8 space-y-6">
            <StandardHeaderHref
                withButton={isAdmin}
                buttonName="Add Machines"
                href={`./machines/machineSetup`}
                title="Machines"
                description="View and manage all registered washers and dryers."
            />
            <ViewToggle view={view} onViewChange={setView} />
            {/* Loading State */}
            {loading ? (
                <SkeletonTable />
            ) : machines.length === 0 ? (
                <EmptyState
                    icon={<Wrench className="h-10 w-10" />}
                    title="No machines registered"
                    description="Get started by adding your first commercial washer or dryer to the system."
                    action={
                        <Link href="./machines/machineSetup">
                            <Button variant="standard" size="sm">Add First Machine</Button>
                        </Link>
                    }
                />
            ) : view === "table" ? (

                /* Table View */
                <div className="rounded border border-gray-200 bg-card shadow-2xl overflow-hidden">
                    <Table>
                        <StandardTableHeader
                            columns={[
                                { label: "Name" },
                                { label: "Type" },
                                { label: "Status" },
                                { label: "Usage Count", align: "left" },
                            ]}
                        />
                        <TableBody>
                            {machines.map((machine) => {
                                return (
                                    <TableRow
                                        className={`border-b border-gray-900 ${isAdmin ? "hover:bg-muted/30 cursor-pointer" : "hover:cursor-not-allowed"
                                            }`}
                                        onClick={() => {
                                            if (isAdmin) {
                                                router.push(`./machines/${machine.id}/edit`);
                                            }
                                        }}
                                        key={machine.id}
                                    >
                                        <TableCell className="font-medium text-foreground border-b border-gray-300">
                                            {machine.name}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground border-b border-gray-300">
                                            <Badge variant="destructive" className="capitalize text-sm font-normal">
                                                {machine.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground border-b border-gray-300">
                                            <StatusBadge status={machine.status} />
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground border-b border-gray-300">
                                            {machine.usageCount}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                /* Card View */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {machines.map((machine) => (
                        <Card key={machine.id} className="shadow-md border border-gray-200">
                            <CardHeader>
                                <CardTitle>{machine.name}</CardTitle>
                                <CardDescription className="capitalize">{machine.type}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-muted-foreground">
                                <p>Status: <StatusBadge status={machine.status} /></p>
                                <p>Usage Count: {machine.usageCount}</p>
                                <p>
                                    Location:{" "}
                                    {machine.location ? (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {machine.location}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground/40">—</span>
                                    )}
                                </p>
                                <p>Comment: {machine.comment || <span className="text-muted-foreground/40">—</span>}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm">Manage</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
