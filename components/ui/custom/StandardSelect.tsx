import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the shape of each dropdown option
export type SelectOption = {
  value: string;
  label: string;
};

// Mirror the props structure of StandardInput
type StandardSelectProps = React.ComponentPropsWithoutRef<typeof Select> & {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

export function StandardSelect({
  name,
  label,
  options,
  placeholder = "Select an option",
  className,
  value,
  onValueChange,
  defaultValue,
  ...props
}: StandardSelectProps) {
  // Matches the exact styling of your StandardInput
  const baseClass =
    "rounded h-12 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 shadow-lg ring-1 text-left w-full flex items-center justify-between";

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        {...props}
      >
        <SelectTrigger
          id={name}
          className={className ?? baseClass}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
