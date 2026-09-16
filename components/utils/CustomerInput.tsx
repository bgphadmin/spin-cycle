'use client'

import { Customer } from "@/features/orders/actions/getData";
import { useState } from "react";


type CustomerInputProps = {
  name: string;
  defaultValue: string;
  customers: Customer[];
  required?: boolean;
};

const MIN_QUERY_LENGTH = 2;

export default function CustomerInput({ name, defaultValue, customers, required }: CustomerInputProps) {
    const [value, setValue] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const query = value.trim().toLowerCase();
    const suggestions = customers
        .filter((customer) => query.length >= MIN_QUERY_LENGTH && customer.name.toLowerCase().includes(query))
        .slice(0, 8);

    const selectCustomer = (customer: Customer) => {
        setValue(customer.name);
        setIsOpen(false);
        setHighlightedIndex(0);
    };

    return (
        <div className="relative flex flex-col gap-2">
            <input
                name={name}
                type="text"
                value={value}
                placeholder="Customer Name"
                required={required}
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen && suggestions.length > 0}
                aria-controls={`${name}-suggestions`}
                aria-autocomplete="list"
                className="h-12 rounded bg-gray-100 px-3 py-2 text-sm shadow-lg ring-1 focus:ring-2 focus:ring-teal-500 mb-6"
                onChange={(event) => {
                    setValue(event.target.value);
                    setHighlightedIndex(0);
                    setIsOpen(event.target.value.trim().length >= MIN_QUERY_LENGTH);
                }}
                onFocus={() => setIsOpen(query.length >= MIN_QUERY_LENGTH)}
                onKeyDown={(event) => {
                    if (!isOpen || suggestions.length === 0) return;
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setHighlightedIndex((index) => (index + 1) % suggestions.length);
                    } else if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setHighlightedIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
                    } else if (event.key === "Enter") {
                        event.preventDefault();
                        selectCustomer(suggestions[highlightedIndex]);
                    } else if (event.key === "Escape") {
                        setIsOpen(false);
                    }
                }}
                onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
            />
            {isOpen && suggestions.length > 0 && (
                <ul
                    id={`${name}-suggestions`}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {suggestions.map((customer, index) => (
                        <li key={customer.id} role="option" aria-selected={index === highlightedIndex}>
                            <button
                                type="button"
                                className={`w-full px-3 py-2 text-left text-sm ${index === highlightedIndex ? "bg-teal-50 text-teal-900" : "hover:bg-gray-50"
                                    }`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectCustomer(customer)}
                            >
                                {customer.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}