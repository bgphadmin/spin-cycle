"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  HomeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/solid"; // filled style
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import DropdownNavItem from "./DropDownNavItem";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/dashboard/sales", label: "Sales", icon: ShoppingCartIcon },
  { href: "/dashboard/expenses", label: "Expenses", icon: CurrencyDollarIcon },
  { href: "/dashboard/inventory", label: "Inventory", icon: ArchiveBoxIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { tenantId } = useParams();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-teal-100 shadow-2xl">
      <ul className="flex justify-around items-center h-16">
        {navItems.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex flex-col items-center text-xs font-medium hover:text-teal-700 ${pathname === href ? "text-teal-700" : "text-teal-500"
                }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              {label}
            </Link>
          </li>
        ))}

        {/* Settings Dropdown */}
        <li>
          <DropdownMenu onOpenChange={setOpen}>
            <DropdownMenuTrigger className="flex flex-col items-center text-xs font-medium hover:text-teal-700 text-teal-500 cursor-pointer">
              <div className="flex items-center gap-1">
                <Cog6ToothIcon className="h-6 w-6 mb-1" />
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"
                    }`}
                />
              </div>
              Settings
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
              <DropdownNavItem
                href={`/dashboard/tenants/${tenantId}/machines`}
                label="Machines"
                onSelect={() => setOpen(false)}
                icon={ArchiveBoxIcon}
              />
              <DropdownNavItem
                href={`/dashboard/tenants/${tenantId}/products`}
                label="Products"
                icon={Cog6ToothIcon}
                onSelect={() => setOpen(false)}
              />
              <DropdownNavItem
                href={`/dashboard/tenants/${tenantId}/users`}
                label="Users"
                icon={UserIcon}
                onSelect={() => setOpen(false)}
              />
              <DropdownNavItem
                href={`/dashboard/tenants/${tenantId}/customers`}
                label="Customers"
                icon={UserIcon}
                onSelect={() => setOpen(false)}
              />
              <DropdownNavItem
                href={`/dashboard/tenants`}
                label="Tenants"
                icon={BuildingOfficeIcon}
                onSelect={() => setOpen(false)}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}