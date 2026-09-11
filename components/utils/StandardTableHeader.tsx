"use client";

import {
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";

interface Column {
  label?: string;   // optional, can be empty for action columns
  align?: "left" | "right" | "center";
  className?: string;
}

interface StandardTableHeaderProps {
  columns: Column[];
}

export function StandardTableHeader({ columns }: StandardTableHeaderProps) {
  return (
    <TableHeader className="bg-muted/30 bg-teal-300 text-gray-700">
      <TableRow className="border-b border-gray-200 mb-1">
        {columns.map((col, idx) => (
          <TableHead
            key={idx}
            className={`px-4 py-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground ${
              col.align === "right"
                ? "text-right"
                : col.align === "center"
                ? "text-center"
                : "text-left"
            } ${col.className || ""}`}
          >
            {col.label || ""}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
