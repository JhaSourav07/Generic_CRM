import { Prisma } from '@prisma/client';

export interface LineItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number | string | Prisma.Decimal;
  discount?: number | string | Prisma.Decimal | null;
  tax?: number | string | Prisma.Decimal | null;
}

export interface CalculatedLineItem {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  total: Prisma.Decimal;
}

export interface CalculatedDocumentTotals {
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  items: CalculatedLineItem[];
}

/**
 * Ensures a value is safely converted to a Prisma.Decimal with non-negative validation.
 */
export function toDecimal(value: number | string | Prisma.Decimal | null | undefined, fallback: number = 0): Prisma.Decimal {
  if (value === null || value === undefined || value === '') {
    return new Prisma.Decimal(fallback);
  }
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  const str = String(value).trim();
  if (isNaN(Number(str))) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return new Prisma.Decimal(str);
}

/**
 * Rounds a Decimal to 2 decimal places (standard financial rounding).
 */
export function roundToCurrency(val: Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(val.toFixed(2));
}

/**
 * Calculates financial values for an individual line item.
 * lineSubtotal = quantity * unitPrice
 * lineDiscount must not exceed lineSubtotal
 * lineTotal = lineSubtotal - lineDiscount + lineTax
 */
export function calculateLineItem(item: LineItemInput): CalculatedLineItem {
  const quantity = Math.floor(Number(item.quantity));
  if (isNaN(quantity) || quantity < 1) {
    throw new Error('Line item quantity must be an integer greater than or equal to 1');
  }

  const unitPriceDec = toDecimal(item.unitPrice);
  if (unitPriceDec.isNegative()) {
    throw new Error('Unit price cannot be negative');
  }

  const rawDiscount = toDecimal(item.discount, 0);
  if (rawDiscount.isNegative()) {
    throw new Error('Line discount cannot be negative');
  }

  const rawTax = toDecimal(item.tax, 0);
  if (rawTax.isNegative()) {
    throw new Error('Line tax cannot be negative');
  }

  const unitPrice = roundToCurrency(unitPriceDec);
  const subtotal = roundToCurrency(new Prisma.Decimal(quantity).mul(unitPrice));

  let discount = roundToCurrency(rawDiscount);
  if (discount.greaterThan(subtotal)) {
    throw new Error(`Line item discount (${discount.toFixed(2)}) cannot exceed line subtotal (${subtotal.toFixed(2)})`);
  }

  const tax = roundToCurrency(rawTax);
  const total = roundToCurrency(subtotal.sub(discount).add(tax));

  if (total.isNegative()) {
    throw new Error('Line item total cannot be negative');
  }

  return {
    productId: item.productId || null,
    description: item.description.trim(),
    quantity,
    unitPrice,
    discount,
    tax,
    subtotal,
    total
  };
}

/**
 * Calculates authoritative document totals (Quotes or Orders) from line items.
 * Frontend values for subtotal, discount, tax, total are ignored.
 */
export function calculateDocumentTotals(items: LineItemInput[]): CalculatedDocumentTotals {
  if (!items || items.length === 0) {
    throw new Error('At least one line item is required');
  }

  let subtotalAcc = new Prisma.Decimal(0);
  let discountAcc = new Prisma.Decimal(0);
  let taxAcc = new Prisma.Decimal(0);
  let totalAcc = new Prisma.Decimal(0);

  const calculatedItems: CalculatedLineItem[] = [];

  for (const item of items) {
    const calc = calculateLineItem(item);
    calculatedItems.push(calc);

    subtotalAcc = subtotalAcc.add(calc.subtotal);
    discountAcc = discountAcc.add(calc.discount);
    taxAcc = taxAcc.add(calc.tax);
    totalAcc = totalAcc.add(calc.total);
  }

  const subtotal = roundToCurrency(subtotalAcc);
  const discount = roundToCurrency(discountAcc);
  const tax = roundToCurrency(taxAcc);
  const total = roundToCurrency(totalAcc);

  if (total.isNegative()) {
    throw new Error('Document final total cannot be negative');
  }

  return {
    subtotal,
    discount,
    tax,
    total,
    items: calculatedItems
  };
}
