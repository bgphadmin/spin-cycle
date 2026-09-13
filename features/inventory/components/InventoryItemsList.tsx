"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/utils/EmptyState";
import SkeletonTable from "@/components/utils/SkeletonTable";
import StandardHeaderHref from "@/components/utils/StandardHeaderHref";
import { StandardTableHeader } from "@/components/utils/StandardTableHeader";
import ViewToggle from "@/components/utils/ToggleView";
import { getServerAuthClaims } from "@/utils/hooks/useAuthClaims";
import { getInventoryItemsAction } from "../actions/inventoryActions";
import { InventoryItem } from "../types/inventoryTypes";

export default function InventoryItemsList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "cards">("table");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void Promise.all([
      getInventoryItemsAction().then((result) => setItems(result.inventoryItems as InventoryItem[])),
      getServerAuthClaims().then(({ orgRole }) => setIsAdmin(orgRole === "org:admin")),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mt-8 space-y-6">
      <StandardHeaderHref
        withButton={isAdmin}
        buttonName="Add Inventory Item"
        href="./inventory/itemSetup"
        title="Inventory"
        description="View and manage stock items and supplies for your shop."
      />
      <ViewToggle view={view} onViewChange={setView} />
      {loading ? (
        <SkeletonTable />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No inventory items registered"
          description="Get started by adding your first inventory item."
          action={isAdmin ? (<Link href="./inventory/itemSetup"><Button variant="standard" size="sm">Add First Item</Button></Link>) : null}
        />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded border border-gray-200 bg-card shadow-2xl">
          <Table>
            <StandardTableHeader columns={[{ label: "Name" }, { label: "Type" }, { label: "Unit" }, { label: "Stock" }, { label: "Price" }]} />
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className={isAdmin ? "cursor-pointer border-b border-gray-900 hover:bg-muted/30" : "border-b border-gray-900"}
                  onClick={() => isAdmin && router.push(`./inventory/${item.id}/edit`)}
                >
                  <TableCell className="border-b border-gray-300 font-medium">{item.name}</TableCell>
                  <TableCell className="border-b border-gray-300 capitalize">{item.type}</TableCell>
                  <TableCell className="border-b border-gray-300">{item.unit}</TableCell>
                  <TableCell className="border-b border-gray-300">{item.stock}</TableCell>
                  <TableCell className="border-b border-gray-300">₱{item.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="capitalize">{item.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Unit: {item.unit}</p>
                <p>Stock: {item.stock}</p>
                <p>Price: ₱{item.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter>
                {isAdmin && <Button variant="outline" size="sm" onClick={() => router.push(`./inventory/${item.id}/edit`)}>Manage</Button>}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
