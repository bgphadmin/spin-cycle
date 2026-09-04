"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function SettingsDropdown() {
  const { tenantId } = useParams();
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Machines", path: "machines" },
    { label: "Products", path: "products" },
    { label: "Users", path: "users" },
  ];

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-1 p-2 rounded hover:bg-teal-100">
        {/* Settings gear */}
        <Settings className="w-5 h-5 text-teal-700" />

        {/* Dropdown arrow (rotates when open) */}
        <ChevronDown
          className={`w-4 h-4 text-teal-700 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-white shadow-md rounded-md p-2">
        {links.map((link) => (
          <DropdownMenuItem key={link.path}>
            <Link
              href={`/dashboard/tenants/${tenantId}/${link.path}`}
              className="block w-full capitalize hover:text-teal-700"
            >
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}