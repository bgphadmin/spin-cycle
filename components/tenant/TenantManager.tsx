"use client"

import * as React from "react"
import FormContainer from "@/components/utils/FormContainer"
import LoadingButton from "@/components/utils/LoadingButton"
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { SortingState } from "@tanstack/react-table"
import Spinner from "@/components/utils/Spinner"
import { useEffectRunCounter } from "@/utils/hooks/customHooks"
import { Tenant } from "@prisma/client"
import { addTenantAction, getTenantsPerPage } from "@/utils/actions/tenant/tenantAction"
import TenantButton from "./TenantButton"
import TenantGrid, { type TenantRow } from "./TenantGrid"
import { EditTenantItem } from "./EditTenantItem"

interface TenantManagerProps {
    initialRows: Tenant[]
    total: number
}

const defaultFormState = {
    id: "",
    shopName: "",
    address: "",
    contactPerson: "",
    contactPosition: "",
    phone: "",
    email: "",
    subscriptionStatus: "REGULAR",
}

export default function TenantManager({ initialRows, total }: TenantManagerProps) {
    const [rows, setRows] = React.useState<Tenant[]>(initialRows)
    const [formValues, setFormValues] = React.useState(defaultFormState)
    const [selectedRow, setSelectedRow] = React.useState<Tenant | null>(null);

    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [startDate, setStartDate] = React.useState("")
    const [endDate, setEndDate] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [totalCount, setTotalCount] = React.useState(total)
    const { increment } = useEffectRunCounter()

    React.useEffect(() => {
        const runCount = increment();
        // Skip first 2 runs (StrictMode double invoke)
        if (runCount <= 2) return
        const handler = setTimeout(() => {
            async function fetchPage() {
                try {
                    setLoading(true); setError(null)
                    const { safeRows, total } = await getTenantsPerPage({
                        pageIndex: pagination.pageIndex,
                        pageSize: pagination.pageSize,
                        q: globalFilter, startDate, endDate, sort: sorting,
                    })
                    setRows(safeRows.map(r => ({
                        id: r.id,
                        shopName: r.shopName,
                        address: r.address,
                        contactPerson: r.contactPerson,
                        contactPosition: r.contactPosition,
                        phone: r.phone,
                        email: r.email,
                        subscriptionStatus: r.subscriptionStatus,
                        createdAt: new Date(r.createdAt),
                    })))
                    setTotalCount(total)
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        setError(err.message)
                    } else {
                        setError("Unexpected error")
                    }
                } finally { setLoading(false) }
            }
            fetchPage()
        }, 2000)
        return () => clearTimeout(handler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination, globalFilter, startDate, endDate, sorting])

    const handleFormChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target
        setFormValues((prev) => ({ ...prev, [name]: value }))
    }

    const handleAddSuccess = (state: { message: string }) => {
        const parsed = JSON.parse(state.message)
        const tenant = parsed[2]?.tenant as Tenant | undefined
        if (tenant) {
            setRows((prev) => [tenant, ...prev])
            setFormValues(defaultFormState)
        }
    }

    const handleEditSuccess = (updated: TenantRow) => {
        setRows((prev) =>
            prev.map((row) => row.id === updated.id ? updated : row)
        );
        setSelectedRow(null);
    };

    const handleDeleteSuccess = (deletedId: string) => {
        setRows((prev) => prev.filter((row) => row.id !== deletedId)); // ✅ remove row
        setSelectedRow(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-teal-700">Tenants</h2>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <TenantButton className="w-full sm:w-auto bg-orange-400 hover:bg-orange-500 px-8 py-7 text-lg text-teal-50 rounded-md shadow-xl cursor-pointer" />
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-orange-50 border border-gray-200 text-teal-900 rounded-xl p-6 shadow-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold text-teal-900">Add Tenant</AlertDialogTitle>
                        </AlertDialogHeader>
                        <FormContainer action={addTenantAction} onSuccess={handleAddSuccess}>
                            {({ loading }) => (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Shop Name</label>
                                            <Input
                                                name="shopName"
                                                type="text"
                                                value={formValues.shopName}
                                                onChange={handleFormChange}
                                                required
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Contact Person</label>
                                            <Input
                                                name="contactPerson"
                                                type="text"
                                                value={formValues.contactPerson}
                                                onChange={handleFormChange}
                                                required
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Contact Position</label>
                                            <Input
                                                name="contactPosition"
                                                type="text"
                                                value={formValues.contactPosition}
                                                onChange={handleFormChange}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Address</label>
                                            <Input
                                                name="address"
                                                type="text"
                                                value={formValues.address}
                                                onChange={handleFormChange}
                                                required
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Email</label>
                                            <Input
                                                name="email"
                                                type="email"
                                                value={formValues.email}
                                                onChange={handleFormChange}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Phone</label>
                                            <Input
                                                name="phone"
                                                type="tel"
                                                value={formValues.phone}
                                                onChange={handleFormChange}
                                                required
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Subscription Status
                                            </label>
                                            <select
                                                name="subscriptionStatus"
                                                value={formValues.subscriptionStatus}
                                                onChange={handleFormChange}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                                            >
                                                <option value="REGULAR">REGULAR</option>
                                                <option value="PREMIUM">PREMIUM</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                            </select>
                                        </div>
                                    </div>
                                    <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-2">
                                        <AlertDialogCancel className="rounded bg-orange-100  px-4 py-5 text-sm  hover:bg-orange-200 cursor-pointer">
                                            Cancel
                                        </AlertDialogCancel>
                                        <LoadingButton className="rounded bg-orange-400 px-4 py-2 text-sm text-teal-50 hover:bg-orange-500 cursor-pointer" loading={loading}>
                                            Submit
                                        </LoadingButton>
                                    </AlertDialogFooter>
                                </>
                            )}
                        </FormContainer>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative">
                    <Input placeholder="Search..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="max-w-md" />
                    {loading && (
                        <span className="absolute right-3 top-2">
                            <Spinner />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <label>From</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <label>To</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <button onClick={() => { setStartDate(""); setEndDate("") }} className="px-2 py-1 bg-orange-400 border text-teal-50 hover:bg-orange-500 border-gray-200 shadow-lg rounded text-sm cursor-pointer">Clear</button>
                </div>
            </div>

            <TenantGrid
                tenants={rows}
                total={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
                onRowClick={row => setSelectedRow(row)}
                sorting={sorting}
                onSortingChange={setSorting}
            />
            {error && <div className="text-sm text-red-600">{error}</div>}

            {selectedRow && (
                <EditTenantItem
                    item={selectedRow}
                    open={true}
                    onOpenChange={(open) => !open && setSelectedRow(null)}
                    onEditSuccess={handleEditSuccess}
                    onDeleteSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    )
}
