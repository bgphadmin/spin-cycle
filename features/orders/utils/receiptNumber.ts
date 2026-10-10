export function getReceiptNumberBase(receiptNumber: string) {
  return receiptNumber.match(/^(\d{4}-\d+)(?:[a-z]+)?$/)?.[1] ?? receiptNumber;
}

export function formatReceiptNumber(base: string, suffixIndex: number) {
  let suffix = "";
  let index = suffixIndex;

  do {
    suffix = String.fromCharCode(97 + (index % 26)) + suffix;
    index = Math.floor(index / 26) - 1;
  } while (index >= 0);

  return `${base}${suffix}`;
}
