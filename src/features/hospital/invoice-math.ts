import type { InvoiceLine, Medicine } from "./types";
// EvoTech's GST-inclusive MRP/discount split, adapted from src/lib/print.ts.
// All persisted values are rounded to paise; the server owns rates and batches.
export const roundMoney = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export function invoiceLine(
  m: Medicine,
  quantity: number,
  discountPercent: number,
): InvoiceLine {
  const gross = roundMoney(m.price * quantity);
  const discount = roundMoney((gross * discountPercent) / 100);
  const total = roundMoney(gross - discount);
  const gstPercent = m.gstPercent || 0;
  const taxable = roundMoney((total * 100) / (100 + gstPercent));
  return {
    medicineId: m.id,
    name: `${m.name} ${m.strength}`,
    batch: m.batch,
    expiry: m.expiry,
    quantity,
    unitPrice: m.price,
    discountPercent,
    gstPercent,
    gross,
    discount,
    taxable,
    tax: roundMoney(total - taxable),
    total,
  };
}
export function invoiceTotals(lines: InvoiceLine[]) {
  const sum = (key: "gross" | "discount" | "taxable" | "tax" | "total") =>
    roundMoney(lines.reduce((n, l) => n + l[key], 0));
  return {
    gross: sum("gross"),
    discount: sum("discount"),
    taxable: sum("taxable"),
    tax: sum("tax"),
    total: sum("total"),
  };
}
