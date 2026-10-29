export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";

type DiscountableOrderItem = {
  price: number;
  quantity: number;
  service: { name: string; type?: string } | null;
};

export function getOrderItemDiscountFactors(
  items: readonly DiscountableOrderItem[],
  orderTotal: number,
  discountAmount: number,
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const baseServiceIndexes = items.flatMap((item, index) =>
    item.service?.type === "WASH" ||
    item.service?.type === "DRY" ||
    item.service?.name.trim().toLocaleLowerCase() === "wash" ||
    item.service?.name.trim().toLocaleLowerCase() === "dry"
      ? [index]
      : [],
  );
  const baseServiceSubtotal = baseServiceIndexes.reduce(
    (sum, index) => sum + items[index].price * items[index].quantity,
    0,
  );
  const orderDiscount = Math.max(
    0,
    Math.min(subtotal, Math.max(discountAmount, subtotal - orderTotal)),
  );

  if (baseServiceSubtotal <= 0 || orderDiscount <= 0) {
    return items.map(() => 1);
  }

  const baseServiceDiscount = Math.min(orderDiscount, baseServiceSubtotal);
  const baseServiceFactor =
    (baseServiceSubtotal - baseServiceDiscount) / baseServiceSubtotal;

  return items.map((_, index) =>
    baseServiceIndexes.includes(index) ? baseServiceFactor : 1,
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
) {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error("The order subtotal is invalid.");
  }
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    throw new Error("Discount must be a valid non-negative number.");
  }
  if (discountType === "PERCENTAGE" && discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  const amount = discountType === "PERCENTAGE"
    ? subtotal * discountValue / 100
    : discountValue;
  if (amount > subtotal) {
    throw new Error("Discount cannot exceed the order subtotal.");
  }
  const roundedAmount = roundMoney(amount);
  if (roundedAmount > roundMoney(subtotal)) {
    throw new Error("Discount cannot exceed the order subtotal.");
  }
  return roundedAmount;
}

export function getDiscountFromForm(formData: FormData, subtotal: number) {
  const discountApplied = formData.get("discountApplied") === "on";
  const discountNote = String(formData.get("discountNote") ?? "").trim();
  if (!discountApplied) {
    return {
      discountApplied: false,
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 0,
      discountAmount: 0,
      discountNote: null,
      total: roundMoney(subtotal),
    };
  }

  const rawDiscountType = String(formData.get("discountType") ?? "FIXED_AMOUNT");
  let discountType: DiscountType;
  if (rawDiscountType === "FIXED_AMOUNT" || rawDiscountType === "PERCENTAGE") {
    discountType = rawDiscountType;
  } else {
    throw new Error("Select a valid discount type.");
  }
  const rawValue = String(formData.get("discountValue") ?? "0").trim();
  const discountValue = rawValue === "" ? 0 : Number(rawValue);
  if (discountValue <= 0) {
    throw new Error("Enter a discount greater than zero.");
  }
  if (!discountNote || discountNote.length > 120) {
    throw new Error("Enter a discount reason of up to 120 characters.");
  }
  const discountAmount = calculateDiscountAmount(
    subtotal,
    discountType,
    discountValue,
  );
  const total = roundMoney(roundMoney(subtotal) - discountAmount);

  return {
    discountApplied: true,
    discountType,
    discountValue,
    discountAmount,
    discountNote,
    total,
  };
}
