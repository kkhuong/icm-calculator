// Number formatting for display, and cleaning of typed number input.

// Dollars with up to 2 decimals: 1234.5 -> "$1,234.5".
export const money = (n) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });

// Grouped number with up to `maxDecimals` decimals: 1234.56 -> "1,234.56".
export const num = (n, maxDecimals = 2) => n.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });

// Fraction as a percentage, without the % sign: 0.1234 -> "12.3".
export const pct = (v, decimals = 1) => (v * 100).toFixed(decimals);

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 23 -> "23rd".
export const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]);

// Cleans typed text into a decimal number string: "," becomes "." (comma-decimal locales), and only
// digits and the first "." are kept.
export function decimalText(t) {
  const [whole, ...rest] = t.replace(/,/g, '.').replace(/[^0-9.]/g, '').split('.');
  return rest.length ? whole + '.' + rest.join('') : whole;
}

// Cleans typed text into a whole number string.
export const digitsText = (t) => t.replace(/[^0-9]/g, '');
