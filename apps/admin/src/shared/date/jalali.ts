/**
 * Shared Jalali (Solar Hijri) calendar utilities.
 *
 * Converted from the Figma prototype reference implementation.
 * No third-party date library added.
 * Do NOT use this for API date serialization — presentation/display only.
 */

import { toPersianDigits } from '@/shared/lib/format';

export const JALALI_MONTHS = [
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
] as const;

export const JALALI_WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

export type JalaliDate = [number, number, number]; // [year, month, day]

/** Format a Jalali date for the existing plan delivery-date field. */
export function formatJalaliInputDate([year, month, day]: JalaliDate): string {
  return toPersianDigits(
    `${String(year).padStart(4, '0')}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
  );
}

/** Parse the plan delivery-date display format without changing its persisted model. */
export function parseJalaliInputDate(value: string): JalaliDate | null {
  const latin = value.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(latin.trim());
  if (!match) return null;

  const date: JalaliDate = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (date[1] < 1 || date[1] > 12 || date[2] < 1 || date[2] > jalaliDaysInMonth(date[0], date[1])) {
    return null;
  }
  return date;
}

/** Convert Gregorian → Jalali. */
export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_y = gy - 1600;
  const g_m = gm - 1;
  const g_d = gd - 1;
  const gMonDays = [
    31,
    28 + (gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0) ? 1 : 0),
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let g_d_no =
    365 * g_y +
    Math.floor((g_y + 3) / 4) -
    Math.floor((g_y + 99) / 100) +
    Math.floor((g_y + 399) / 400);
  for (let i = 0; i < g_m; i++) g_d_no += gMonDays[i]!;
  g_d_no += g_d;
  let j_d_no = g_d_no - 79;
  const j_np = Math.floor(j_d_no / 12053);
  j_d_no %= 12053;
  let j_y = 979 + 33 * j_np + 4 * Math.floor(j_d_no / 1461);
  j_d_no %= 1461;
  if (j_d_no >= 366) {
    j_y += Math.floor((j_d_no - 1) / 365);
    j_d_no = (j_d_no - 1) % 365;
  }
  const j_mi = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
  const jMonth = j_mi.reduce((found, offset, idx) => (j_d_no >= offset ? idx : found), 0);
  return [j_y, jMonth + 1, j_d_no - (j_mi[jMonth] ?? 0) + 1];
}

/** Convert Jalali → Gregorian. */
export function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const j_y = jy - 979;
  const j_m = jm - 1;
  const j_d = jd - 1;
  const jMonDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let j_d_no = 365 * j_y + Math.floor(j_y / 33) * 8 + Math.floor(((j_y % 33) + 3) / 4);
  for (let i = 0; i < j_m; i++) j_d_no += jMonDays[i]!;
  j_d_no += j_d;
  let g_d_no = j_d_no + 79;
  let g_y = 1600 + 400 * Math.floor(g_d_no / 146097);
  g_d_no %= 146097;
  let leap = true;
  if (g_d_no >= 36525) {
    g_d_no--;
    g_y += 100 * Math.floor(g_d_no / 36524);
    g_d_no %= 36524;
    if (g_d_no >= 365) g_d_no++;
    else leap = false;
  }
  g_y += 4 * Math.floor(g_d_no / 1461);
  g_d_no %= 1461;
  if (g_d_no >= 366) {
    leap = false;
    g_d_no--;
    g_y += Math.floor(g_d_no / 365);
    g_d_no %= 365;
  }
  const g_mon = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gMonth = 0;
  let gDay = g_d_no;
  while (gMonth < 12 && gDay >= (g_mon[gMonth] ?? 0)) {
    gDay -= g_mon[gMonth] ?? 0;
    gMonth++;
  }
  return [g_y, gMonth + 1, gDay + 1];
}

/** Days in a Jalali month. */
export function jalaliDaysInMonth(y: number, m: number): number {
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  return (y * 8 + 29) % 33 < 8 ? 30 : 29;
}

/** First day-of-week for month (0=Saturday, 6=Friday — Persian week). */
export function jalaliFirstDayOfWeek(y: number, m: number): number {
  const [gy, gm, gd] = toGregorian(y, m, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay();
  return (jsDay + 1) % 7;
}

/** Convert a JS Date to a JalaliDate. */
export function dateToJalali(date: Date): JalaliDate {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Convert a `serviceDateSortKey` string (YYYY-MM-DD in Jalali) to JalaliDate. */
export function sortKeyToJalali(key: string): JalaliDate | null {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return [parts[0]!, parts[1]!, parts[2]!];
}

/** Format a JalaliDate as full label: e.g. "۱۴ مرداد ۱۴۰۳" */
export function jalaliDayLabel(j: JalaliDate, toPersian: (v: number | string) => string): string {
  return `${toPersian(j[2])} ${JALALI_MONTHS[j[1] - 1]} ${toPersian(j[0])}`;
}

/** Format a JalaliDate as short label: e.g. "۱۴ مرداد" */
export function jalaliShortLabel(j: JalaliDate, toPersian: (v: number | string) => string): string {
  return `${toPersian(j[2])} ${JALALI_MONTHS[j[1] - 1]}`;
}

/** Compare two JalaliDates. Returns negative/0/positive. */
export function compareJalali(a: JalaliDate, b: JalaliDate): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

/** Check if two JalaliDates represent the same day. */
export function jalaliDatesEqual(a: JalaliDate, b: JalaliDate): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/** Convert a serviceDateSortKey (Jalali YYYY-MM-DD) to a comparable string. */
export function jalaliSortKey(j: JalaliDate): string {
  return `${String(j[0]).padStart(4, '0')}-${String(j[1]).padStart(2, '0')}-${String(j[2]).padStart(2, '0')}`;
}

/** Add N Gregorian days to a Jalali date. */
export function addDaysToJalali(j: JalaliDate, days: number): JalaliDate {
  const [gy, gm, gd] = toGregorian(j[0], j[1], j[2]);
  const d = new Date(gy, gm - 1, gd + days);
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Human-readable relative age label. */
export function relativeDayLabel(
  daysPast: number,
  todayJ: JalaliDate,
  toPersian: (v: number | string) => string,
): string {
  if (daysPast === 0) return 'امروز';
  if (daysPast === 1) return 'دیروز';
  if (daysPast === 2) return `${toPersian(2)} روز پیش`;
  if (daysPast === 3) return `${toPersian(3)} روز پیش`;
  const past = addDaysToJalali(todayJ, -daysPast);
  return `${toPersian(past[2])} ${JALALI_MONTHS[past[1] - 1]}`;
}
