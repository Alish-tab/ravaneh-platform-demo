import { toPersianDigits } from '@/shared/lib/format';

const PERSIAN_MONTHS = [
  '',
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Presentation-only plan name suggestion from display date/window.
 * Not a Backend serialization rule.
 */
export function generatePlanName(deliveryDate: string, window?: string): string {
  const parsed = parsePersianDateInput(deliveryDate);
  if (!parsed) return 'برنامه تحویل';
  const base = `برنامه تحویل — ${parsed.day} ${PERSIAN_MONTHS[parsed.month]}`;
  if (window) return `${base} — ${window}`;
  return base;
}

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

function parsePersianDateInput(value: string): { month: number; day: string } | null {
  const latin = toLatinDigits(value);
  const parts = latin.split('/');
  if (parts.length !== 3) return null;
  const month = Number.parseInt(parts[1] ?? '', 10);
  const dayNum = Number.parseInt(parts[2] ?? '', 10);
  if (!month || month < 1 || month > 12 || Number.isNaN(dayNum)) return null;
  return { month, day: toPersianDigits(dayNum) };
}

/** Fixture-local sortable Jalali key. Not a Backend DATE contract. */
export function toServiceDateSortKey(deliveryDate: string): string {
  const latin = toLatinDigits(deliveryDate);
  const parts = latin.split('/');
  if (parts.length !== 3) return '0000-00-00';
  const year = Number.parseInt(parts[0] ?? '', 10);
  const month = Number.parseInt(parts[1] ?? '', 10);
  const day = Number.parseInt(parts[2] ?? '', 10);
  if (!year || !month || !day) return '0000-00-00';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addJalaliDay(sortKey: string, days: number): string {
  const [yearRaw, monthRaw, dayRaw] = sortKey.split('-').map((part) => Number.parseInt(part, 10));
  let year = yearRaw || 0;
  let month = monthRaw || 1;
  let day = (dayRaw || 1) + days;
  const monthLength = (m: number) => (m <= 6 ? 31 : m <= 11 ? 30 : 29);
  while (day > monthLength(month)) {
    day -= monthLength(month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += monthLength(month);
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatFileSizeLabel(bytes: number): string {
  const sizeKb = Math.round(bytes / 1024);
  if (sizeKb > 1000) {
    return `${toPersianDigits((sizeKb / 1024).toFixed(1))} مگابایت`;
  }
  return `${toPersianDigits(sizeKb)} کیلوبایت`;
}
