"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import SettingsButton from "./SettingsButton"

// interface SettingsMenuProps {
//     isAdmin: boolean
//     isSuperUser: boolean
// }

// export default function SettingsMenu({ isAdmin, isSuperUser }: SettingsMenuProps) {
export default function SettingsMenu() {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // 👇 Only render if Admin or SuperUser
    // if (!isAdmin && !isSuperUser) {
    //     return null
    // }

    return (
        <div className="relative" ref={menuRef}>
            {/* Main Settings link */}
            {/* <span
                onClick={() => setOpen(!open)}
                className="cursor-pointer hover:text-teal-600  font-semibold text-stone-600 text-lg"
            >
                Settings ▾
            </span> */}
            <span className="mx-2">
                <SettingsButton tenantId="1" /> ▾
            </span>
            {/* Dropdown menu */}
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg">
                    <Link
                        href="/dashboard/tenants/1/machines"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                    >
                        Machines
                    </Link>
                    <Link
                        href="/scanner"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                    >
                        Scanner
                    </Link>
                    <Link
                        href="/suppliers"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                    >
                        Suppliers
                    </Link>
                    <Link
                        href="/inventory"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                    >
                        Inventory
                    </Link>
                    {/* {isSuperUser && ( */}
                        <Link
                            href="/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setOpen(false)}
                        >
                            Users
                        </Link>
                    {/* )} */}
                </div>
            )}
        </div>
    )
}