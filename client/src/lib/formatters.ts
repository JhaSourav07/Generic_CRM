/**
 * Vynexa CRM Standardized Formatting Utilities
 * Provides consistent currency, number, date, percentage, and ID formatting
 * according to enterprise design rules.
 */

/**
 * Format monetary values consistently using currency symbol and locale formatting.
 * Defaults to USD ($) if not specified.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'USD'
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '$0.00';
  }

  const num = Number(amount);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (_err) {
    // Fallback if currency code is not supported by runtime
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format date in clean, readable format: "Jan 15, 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format datetime including hour/minute: "Jan 15, 2026, 3:30 PM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format numbers with thousands separators: "1,250,000"
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0';
  }
  return Number(num).toLocaleString('en-US');
}

/**
 * Format percentages with specified decimal places: "42.5%"
 */
export function formatPercentage(
  val: number | string | null | undefined,
  decimals = 1
): string {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return '0.0%';
  }
  return `${Number(val).toFixed(decimals)}%`;
}

/**
 * Format UUID or reference code for high-density display: "a1b2...c3d4"
 */
export function truncateId(id: string | null | undefined, length = 8): string {
  if (!id) return '';
  if (id.length <= length) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
