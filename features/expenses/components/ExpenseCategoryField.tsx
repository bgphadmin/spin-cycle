"use client";

import { useState } from "react";
import { StandardSelect } from "@/components/ui/custom/StandardSelect";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import { CUSTOM_CATEGORY_VALUE, EXPENSE_CATEGORY_OPTIONS, isPresetCategory } from "../types/expenseTypes";

type Props = {
  defaultCategory?: string;
};

// Shared category picker used by both the Add and Edit expense forms. Lets
// staff choose one of the preset categories or type their own custom one.
export default function ExpenseCategoryField({ defaultCategory }: Props) {
  const startsAsCustom = !!defaultCategory && !isPresetCategory(defaultCategory);
  const [selected, setSelected] = useState<string>(
    startsAsCustom ? CUSTOM_CATEGORY_VALUE : defaultCategory ?? ""
  );

  return (
    <>
      <StandardSelect
        name="category"
        label="Category"
        required
        placeholder="Select a category"
        options={EXPENSE_CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
        value={selected}
        onValueChange={setSelected}
        className="bg-teal-100"
      />
      {selected === CUSTOM_CATEGORY_VALUE && (
        <StandardInput
          name="customCategory"
          placeholder="Enter custom category"
          defaultValue={startsAsCustom ? defaultCategory : ""}
          required
        />
      )}
    </>
  );
}
