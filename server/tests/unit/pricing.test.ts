import { describe, it, expect } from 'vitest';
import { calculateLineItem, calculateDocumentTotals, toDecimal, roundToCurrency } from '../../src/utils/pricing.js';
import { Prisma } from '@prisma/client';

describe('Pricing & Financial Calculations Unit Tests', () => {
  it('should convert numbers and strings safely to Prisma.Decimal', () => {
    const d1 = toDecimal(100.5);
    expect(d1.toNumber()).toBe(100.5);

    const d2 = toDecimal('25000.75');
    expect(d2.toNumber()).toBe(25000.75);

    const d3 = toDecimal(null, 0);
    expect(d3.toNumber()).toBe(0);

    expect(() => toDecimal('invalid-number')).toThrow('Invalid numeric value');
  });

  it('should round correctly to standard 2 decimal places', () => {
    const r1 = roundToCurrency(new Prisma.Decimal('10.555'));
    expect(r1.toString()).toBe('10.56');

    const r2 = roundToCurrency(new Prisma.Decimal('10.554'));
    expect(r2.toString()).toBe('10.55');
  });

  it('should correctly calculate individual line item subtotal, discount, tax, and total', () => {
    // 2 * 25000 = 50000 subtotal, discount 5000, tax 8100 -> total 53100
    const line = calculateLineItem({
      productId: 'prod-123',
      description: 'Website Development',
      quantity: 2,
      unitPrice: 25000,
      discount: 5000,
      tax: 8100
    });

    expect(line.quantity).toBe(2);
    expect(line.unitPrice.toFixed(2)).toBe('25000.00');
    expect(line.subtotal.toFixed(2)).toBe('50000.00');
    expect(line.discount.toFixed(2)).toBe('5000.00');
    expect(line.tax.toFixed(2)).toBe('8100.00');
    expect(line.total.toFixed(2)).toBe('53100.00');
  });

  it('should handle boundary financial values and exact decimal arithmetic', () => {
    // 3 * 0.10 = 0.30 (not 0.30000000000000004)
    const line1 = calculateLineItem({
      description: 'Micro charge',
      quantity: 3,
      unitPrice: '0.10',
      discount: 0,
      tax: 0
    });
    expect(line1.subtotal.toFixed(2)).toBe('0.30');
    expect(line1.total.toFixed(2)).toBe('0.30');

    // High precision values
    const line2 = calculateLineItem({
      description: 'Large enterprise line',
      quantity: 10,
      unitPrice: '999999.99',
      discount: '1000.50',
      tax: '18000.00'
    });
    expect(line2.subtotal.toFixed(2)).toBe('9999999.90');
    expect(line2.total.toFixed(2)).toBe('10016999.40');
  });

  it('should reject invalid quantities and negative unit prices', () => {
    expect(() =>
      calculateLineItem({
        description: 'Test',
        quantity: 0,
        unitPrice: 100
      })
    ).toThrow('quantity must be an integer greater than or equal to 1');

    expect(() =>
      calculateLineItem({
        description: 'Test',
        quantity: -2,
        unitPrice: 100
      })
    ).toThrow('quantity must be an integer greater than or equal to 1');

    expect(() =>
      calculateLineItem({
        description: 'Test',
        quantity: 1,
        unitPrice: -50
      })
    ).toThrow('Unit price cannot be negative');
  });

  it('should reject line discounts that exceed subtotal', () => {
    expect(() =>
      calculateLineItem({
        description: 'Over-discounted',
        quantity: 1,
        unitPrice: 100,
        discount: 150
      })
    ).toThrow('cannot exceed line subtotal');
  });

  it('should calculate complete document totals accurately from multiple line items', () => {
    const doc = calculateDocumentTotals([
      {
        description: 'Item 1',
        quantity: 2,
        unitPrice: 100.50,
        discount: 10.00,
        tax: 5.00
      },
      {
        description: 'Item 2',
        quantity: 1,
        unitPrice: 50.00,
        discount: 0,
        tax: 2.50
      }
    ]);

    // Item 1: subtotal 201.00, total = 201 - 10 + 5 = 196.00
    // Item 2: subtotal 50.00, total = 50 - 0 + 2.50 = 52.50
    // Doc: subtotal = 251.00, discount = 10.00, tax = 7.50, total = 248.50
    expect(doc.subtotal.toFixed(2)).toBe('251.00');
    expect(doc.discount.toFixed(2)).toBe('10.00');
    expect(doc.tax.toFixed(2)).toBe('7.50');
    expect(doc.total.toFixed(2)).toBe('248.50');
  });

  it('should require at least one line item for document calculations', () => {
    expect(() => calculateDocumentTotals([])).toThrow('At least one line item is required');
  });
});
