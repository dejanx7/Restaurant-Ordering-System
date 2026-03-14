// All monetary calculations in integer cents to avoid floating-point errors

export function calculateSubtotal(
  items: { price: number; quantity: number; modifiers: { priceAdj: number }[] }[]
): number {
  return items.reduce((sum, item) => {
    const modifierTotal = item.modifiers.reduce((m, mod) => m + mod.priceAdj, 0);
    return sum + (item.price + modifierTotal) * item.quantity;
  }, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate);
}

export function calculateTotal(
  subtotal: number,
  taxAmount: number,
  deliveryFee: number,
  discountAmount: number
): number {
  return subtotal + taxAmount + deliveryFee - discountAmount;
}

export function calculateDiscount(
  subtotal: number,
  discountType: "FLAT_AMOUNT" | "PERCENTAGE",
  discountValue: number
): number {
  if (discountType === "FLAT_AMOUNT") {
    return Math.min(discountValue, subtotal);
  }
  // discountValue is in basis points: 1000 = 10%
  return Math.round(subtotal * (discountValue / 10000));
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
