"use client";

import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ComponentType, SVGProps } from "react";
import { Icon } from "lucide-react";

interface DropdownNavItemProps {
    href: string;
    label: string;
    icon?: ComponentType<SVGProps<SVGSVGElement>>; // optional icon
    onSelect?: () => void;
}

export default function DropdownNavItem({ href, label, icon: Icon, onSelect }: DropdownNavItemProps) {
    return (
        <DropdownMenuItem asChild>
            <Link
                href={href}
                className="w-full hover:text-teal-700 text-xl cursor-pointer"
                onClick={onSelect} // ✅ closes dropdown when clicked
            >
                {Icon && <Icon className="h-5 w-5 text-teal-500" />} {/* ✅ icon support */}
                {label}
            </Link>
        </DropdownMenuItem>
    );
}