const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * Presentation-only digit conversion. Do not apply to raw API / technical values.
 */
export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}
