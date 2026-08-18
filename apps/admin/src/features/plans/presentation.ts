import type { StatusTone } from '@/shared/ui';

import type {
  A01PresentationStatus,
  A01StageKey,
  MergeStrategy,
  PlanLifecycle,
} from '@/features/plans/a01-types';

export const A01_STAGE_LABELS: Record<A01StageKey, string> = {
  intake: 'داده‌های برنامه',
  review: 'بررسی داده',
  planning: 'برنامه‌ریزی',
  execution: 'اجرا',
};

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

export const PLAN_LIFECYCLE_PRESENTATION: Record<
  PlanLifecycle,
  { label: string; compactLabel: string; tone: StatusTone; pulse?: boolean }
> = {
  draft: { label: 'پیش‌نویس', compactLabel: 'پیش‌نویس', tone: 'neutral' },
  readyToPublish: { label: 'آماده انتشار', compactLabel: 'آماده انتشار', tone: 'success' },
  published: { label: 'منتشرشده / آماده اجرا', compactLabel: 'منتشرشده', tone: 'success' },
  inProgress: { label: 'در حال اجرا', compactLabel: 'در حال اجرا', tone: 'accent', pulse: true },
  completed: { label: 'تکمیل‌شده', compactLabel: 'تکمیل‌شده', tone: 'neutral' },
};

export const MERGE_STRATEGY_COPY: Record<
  MergeStrategy,
  { title: string; body: string; recommended?: boolean; destructive?: boolean }
> = {
  'add-only': {
    title: 'افزودن سفارش‌های جدید',
    body: 'سفارش‌های جدید اضافه می‌شوند. سفارش‌های موجود و غایب بدون تغییر می‌مانند.',
  },
  'update-preserve': {
    title: 'به‌روزرسانی داده‌های فعلی',
    body: 'سفارش‌های جدید اضافه و سفارش‌های تغییر یافته به‌روز می‌شوند. موارد غایب حفظ می‌شوند.',
    recommended: true,
  },
  'full-replace': {
    title: 'جایگزینی کامل با فایل جدید',
    body: 'سفارش‌های غایب از نسخه کاری فعلی حذف می‌شوند. سفارش‌های بدون تغییر و سوابق بررسی حفظ می‌شوند.',
    destructive: true,
  },
};

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
  'invalid-type': {
    title: 'نوع فایل پشتیبانی نمی‌شود',
    body: 'فقط فایل اکسل با پسوند xlsx یا xls قابل بارگذاری است.',
  },
};
