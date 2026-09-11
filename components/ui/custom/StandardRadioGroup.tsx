"use client";

import * as React from "react";

interface StandardRadioGroupProps {
    name: string;
    label: string;
    options: { value: string; label: string }[];
    required?: boolean;
}

export function StandardRadioGroup({ name, label, options, required }: StandardRadioGroupProps) {
    return (
        <div className="relative w-full">
            {/* Floating label */}
            <label
                htmlFor={name}
                className="absolute -top-2 left-2 bg-white px-1 text-xs font-medium text-gray-700"
            >
                {label}
            </label>

            {/* Border box styled like StandardInput */}
            <div
                className="flex items-center justify-between rounded-md border border-gray-300 px-3 h-12
                   shadow-sm focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500"
            >
                {options.map((opt) => (
                    <label
                        key={opt.value}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            required={required}
                            className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
