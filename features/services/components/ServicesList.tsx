"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/utils/EmptyState";
import SkeletonTable from "@/components/utils/SkeletonTable";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import { StandardTableHeader } from "@/components/utils/StandardTableHeader";
import ViewToggle from "@/components/utils/ToggleView";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { getServicesAction } from "../actions/serviceActions";
import { Service } from "../types/serviceTypes";

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "cards">("table");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void Promise.all([
      getServicesAction().then((result) => setServices(result.services as Service[])),
      getServerAuthClaims().then(({ orgRole }) => setIsAdmin(orgRole === "org:admin")),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref
        withButton={isAdmin}
        buttonName="Add Services"
        href="./services/serviceSetup"
        title="Services"
        description="View and manage the laundry services offered by your shop."
      />
      <ViewToggle view={view} onViewChange={setView} />
      {loading ? (
        <SkeletonTable />
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="h-10 w-10" />}
          title="No services registered"
          description="Get started by adding your first laundry service."
          action={<Link href="./services/serviceSetup"><Button variant="standard" size="sm">Add First Service</Button></Link>}
        />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded border border-gray-200 bg-card shadow-2xl">
          <Table>
            <StandardTableHeader columns={[{ label: "Type" }, { label: "Name" }, { label: "Price" }, { label: "Duration" }]} />
            <TableBody>
              {services.map((service) => (
                <TableRow
                  key={service.id}
                  className={isAdmin ? "cursor-pointer border-b border-gray-900 hover:bg-muted/30" : "border-b border-gray-900"}
                  onClick={() => isAdmin && router.push(`./services/${service.id}/edit`)}
                >
                  <TableCell className="border-b border-gray-300">{service.type}</TableCell>
                  <TableCell className="border-b border-gray-300 font-medium">{service.name}</TableCell>
                  <TableCell className="border-b border-gray-300">₱{service.price.toFixed(2)}</TableCell>
                  <TableCell className="border-b border-gray-300">{service.duration ? `${service.duration} min` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.type} · {service.duration ? `${service.duration} minutes` : "Duration not set"}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Price: ₱{service.price.toFixed(2)}</CardContent>
              <CardFooter>
                {isAdmin && <Button variant="outline" size="sm" onClick={() => router.push(`./services/${service.id}/edit`)}>Manage</Button>}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
