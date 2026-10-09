"use client";

import type { DiscountType } from "@/features/orders/utils/discount";

export default function DiscountFields({
  applied,
  type,
  value,
  note,
  onAppliedChange,
  onTypeChange,
  onValueChange,
  onNoteChange,
  disabled = false,
}: {
  applied: boolean;
  type: DiscountType;
  value: string;
  note: string;
  onAppliedChange: (applied: boolean) => void;
  onTypeChange: (type: DiscountType) => void;
  onValueChange: (value: string) => void;
  onNoteChange: (note: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="rounded-md border border-gray-200 p-4">
      <legend className="px-2 text-sm font-medium text-gray-700">Discounts</legend>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          name="discountApplied"
          type="checkbox"
          checked={applied}
          onChange={(event) => onAppliedChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 accent-teal-600"
        />
        Apply discount
      </label>
      {applied && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Discount type
            <select
              name="discountType"
              value={type}
              onChange={(event) => {
                const nextType = event.target.value;
                if (nextType === "FIXED_AMOUNT" || nextType === "PERCENTAGE") {
                  onTypeChange(nextType);
                }
              }}
              disabled={disabled}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="FIXED_AMOUNT">Fixed amount (₱)</option>
              <option value="PERCENTAGE">Percentage (%)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Discount
            <input
              name="discountValue"
              type="number"
              min="0.01"
              step="0.01"
              max={type === "PERCENTAGE" ? 100 : undefined}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              disabled={disabled}
              required
              className="h-10 rounded-md border border-gray-300 px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
            Discount reason/type given to customer
            <input
              name="discountNote"
              type="text"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              maxLength={120}
              disabled={disabled}
              required
              className="h-10 rounded-md border border-gray-300 px-3 text-sm"
              placeholder="e.g. Senior discount"
            />
          </label>
        </div>
      )}
    </fieldset>
  );
}
