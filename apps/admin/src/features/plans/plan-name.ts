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

function parsePersianDateInput(value: string): { month: number; day: string } | null {
  const latin = value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parts = latin.split('/');
  if (parts.length !== 3) return null;
  const month = Number.parseInt(parts[1] ?? '', 10);
  const dayNum = Number.parseInt(parts[2] ?? '', 10);
  if (!month || month < 1 || month > 12 || Number.isNaN(dayNum)) return null;
  return { month, day: toPersianDigits(dayNum) };
}

export function formatFileSizeLabel(bytes: number): string {
  const sizeKb = Math.round(bytes / 1024);
  if (sizeKb > 1000) {
    return `${toPersianDigits((sizeKb / 1024).toFixed(1))} مگابایت`;
  }
  return `${toPersianDigits(sizeKb)} کیلوبایت`;
}
