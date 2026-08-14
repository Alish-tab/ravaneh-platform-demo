import type { StatusTone } from '@/shared/ui';

import type { A01PresentationStatus, A01StageKey } from '@/features/plans/a01-types';

export const A01_PLAN_STAGES: { key: A01StageKey; label: string; num: number }[] = [
  { key: 'intake', label: 'ورود داده', num: 1 },
  { key: 'review', label: 'بررسی داده', num: 2 },
  { key: 'planning', label: 'برنامه‌ریزی و تخصیص', num: 3 },
  { key: 'execution', label: 'اجرا', num: 4 },
];

export const A01_STAGE_FILTER_OPTIONS: { key: A01StageKey | 'all'; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'intake', label: 'ورود داده' },
  { key: 'review', label: 'بررسی' },
  { key: 'planning', label: 'برنامه‌ریزی' },
  { key: 'execution', label: 'اجرا' },
];

export const A01_STAGE_LABELS: Record<A01StageKey, string> = {
  intake: 'ورود داده',
  review: 'بررسی داده',
  planning: 'برنامه‌ریزی',
  execution: 'اجرا',
};

/** Maps A01 presentation status → StatusBadge tone + Persian label. */
export const A01_STATUS_PRESENTATION: Record<
  A01PresentationStatus,
  { label: string; tone: StatusTone; pulse?: boolean }
> = {
  draft: { label: 'پیش‌نویس', tone: 'neutral' },
  uploading: { label: 'در حال بارگذاری', tone: 'info', pulse: true },
  process: { label: 'در حال پردازش', tone: 'info', pulse: true },
  intake_failed: { label: 'خطای ورود داده', tone: 'error' },
  review: { label: 'نیازمند بررسی', tone: 'warning' },
  ready: { label: 'آماده برنامه‌ریزی', tone: 'success' },
  planning_active: { label: 'در حال برنامه‌ریزی', tone: 'accent', pulse: true },
  active: { label: 'در حال اجرا', tone: 'accent', pulse: true },
  done: { label: 'تکمیل‌شده', tone: 'success' },
};

export const A01_DELIVERY_WINDOWS = ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸', '۱۸ تا ۲۱'] as const;

export const A01_STRUCTURAL_ERROR_COPY: Record<
  string,
  { title: string; body: string }
> = {
  unreadable: {
    title: 'فایل قابل خواندن نیست',
    body: 'فایل انتخاب‌شده خراب یا رمزگذاری‌شده است. فایل اکسل سالمی بارگذاری کنید.',
  },
  empty: {
    title: 'فایل هیچ ردیف قابل استفاده‌ای ندارد',
    body: 'فایل باز شد اما هیچ ردیف داده‌ای یافت نشد. مطمئن شوید که ورک‌شیت صحیح را صادر کرده‌اید.',
  },
  'missing-columns': {
    title: 'ستون‌های ضروری شناسایی نشدند',
    body: 'فایل فاقد ستون‌های الزامی مانند آدرس یا کد مشتری است. ساختار فایل را با الگوی مورد انتظار مقایسه کنید.',
  },
  network: {
    title: 'بارگذاری فایل انجام نشد',
    body: 'اتصال قطع شد. اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.',
  },
  'duplicate-file': {
    title: 'این فایل قبلاً برای این برنامه بارگذاری شده است',
    body: 'فایل یکسانی قبلاً پردازش شده است. اگر داده‌ها تغییر کرده، فایل جدیدی با محتوای متفاوت بارگذاری کنید.',
  },
};
