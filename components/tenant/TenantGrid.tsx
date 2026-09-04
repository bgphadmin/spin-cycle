"use client"

import * as React from "react"
import {
    flexRender,
    SortingState,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    createColumnHelper,
} from "@tanstack/react-table"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Tenant } from "@prisma/client"

export type TenantRow = Tenant


const columnHelper = createColumnHelper<TenantRow>()

const columns = [
    columnHelper.accessor("shopName", {
        id: "shopName",
        header: "Shop Name",
    }),
    columnHelper.accessor("contactPerson", {
        id: "contactPerson",
        header: "Contact Person",
    }),
    columnHelper.accessor("phone", {
        id: "phone",
        header: "Phone",
    }),
    columnHelper.accessor("address", {
        id: "address",
        header: "Address",
    }),
    columnHelper.accessor("subscriptionStatus", {
        id: "subscriptionStatus",
        header: "Subscription Status",
    }),
]

interface TenantGridProps {
    tenants: TenantRow[]
    total: number
    pagination: { pageIndex: number; pageSize: number }
    onPaginationChange: React.Dispatch<
        React.SetStateAction<{ pageIndex: number; pageSize: number }>
    >
    onRowClick?: (row: TenantRow) => void
    sorting: SortingState
    onSortingChange: (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => void
    globalFilter?: string
    onGlobalFilterChange?: (value: string) => void
}

export default function TenantGrid({
    tenants,
    total,
    pagination,
    onPaginationChange,
    onRowClick,
    sorting,
    onSortingChange,
    globalFilter = "",
    onGlobalFilterChange,
}: TenantGridProps) {
    "use no memo"

    // TanStack Table returns an intentionally mutable table instance.
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: tenants,
        columns,
        state: { sorting, globalFilter, pagination },
        onSortingChange,
        onGlobalFilterChange,
        onPaginationChange,
        pageCount: Math.ceil(total / pagination.pageSize), // 👈 server-side page count
        manualPagination: true, // 👈 tells TanStack we fetch data manually
        manualSorting: true, // 👈 important: sorting handled server-side
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <div className="space-y-4">
            <div className="overflow-auto bg-background shadow-sm">
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="whitespace-nowrap bg-teal-500">
                                        {header.isPlaceholder ? null : (
                                            <button
                                                type="button"
                                                onClick={header.column.getToggleSortingHandler()}
                                                className={cn(
                                                    "flex items-center gap-2 text-left text-sm font-semibold text-teal-100",
                                                    header.column.getCanSort() ? "cursor-pointer" : "cursor-default"
                                                )}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() ? (
                                                    <span className="text-slate-500">
                                                        {header.column.getIsSorted() === "asc" && "↑"}
                                                        {header.column.getIsSorted() === "desc" && "↓"}
                                                        {header.column.getIsSorted() === false && <ChevronDownIcon className="h-4 w-4 opacity-50" />}
                                                    </span>
                                                ) : null}
                                            </button>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row, rowIndex) => (
                                <TableRow
                                    key={row.id}
                                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                    className={cn(
                                        rowIndex % 2 === 0 ? undefined : "bg-teal-100 ",
                                        onRowClick ? "cursor-pointer hover:bg-teal-400 hover:text-white" : undefined
                                    )}
                                >
                                    {row.getAllCells().map((cell) => (
                                        <TableCell key={cell.id} className="align-top py-3 px-3 text-sm text-foreground">
                                            {cell.column.id === "quantityKg" ? (
                                                <span className="font-medium">{String(cell.getValue())}</span>
                                            ) : (
                                                <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow                            >
                                <TableCell colSpan={columns.length} className="p-6 text-center text-sm text-slate-500">
                                    No distribution records match your filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-1 bg-teal-500 text-black rounded hover:bg-teal-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span>
                    Page {pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-1 bg-teal-500 text-black hover:bg-teal-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-2xl"
                >
                    Next
                </button>
            </div>
        </div>
    )
}
