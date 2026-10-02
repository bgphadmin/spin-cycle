"use client";

type PettyCashSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function PettyCashSwitch({ checked, onChange }: PettyCashSwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
      <input
        type="checkbox"
        name="deductFromPettyCash"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-teal-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">Deduct from Petty Cash</span>
        <span className="text-xs text-gray-500">
          The expense category will be recorded as the Petty Cash name.
        </span>
      </span>
    </label>
  );
}
