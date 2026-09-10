import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label?: string;
  as?: "input";
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label?: string;
  as: "textarea";
};

type StandardizedInputProps = InputProps | TextareaProps;

export function StandardInput({
  name,
  label,
  as = "input",
  className,
  ...props
}: StandardizedInputProps) {
  const baseClass =
    "rounded h-12 bg-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 shadow-lg ring-1";
  const inputId = (props as any).id || name;

  // remove name/id from props so they don’t overwrite
  const { id, name: _name, ...rest } = props as any;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      )}
      {as === "textarea" ? (
        <Textarea
          id={inputId}
          name={name}
          className={className ?? baseClass}
          {...rest}
        />
      ) : (
        <Input
          id={inputId}
          name={name}
          className={className ?? baseClass}
          {...rest}
        />
      )}
    </div>
  );
}