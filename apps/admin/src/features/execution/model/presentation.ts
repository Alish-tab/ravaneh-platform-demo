import type {
  AreaExecState,
  ExecutionSystemNoticeKind,
  ExecutionUiStatus,
} from '@/features/execution/model/types';

/** Fixture-local failure codes → Persian presentation. Not a Backend enum. */
export const FAILURE_REASON_LABEL: Record<string, string> = {
  closed_door: 'درب بسته',
  incomplete_address: 'آدرس ناقص',
  customer_absent: 'مشتری غایب',
  no_answer: 'تماس بی‌پاسخ',
};

export function failureReasonLabel(code: string | undefined): string {
  if (!code) return '—';
  return FAILURE_REASON_LABEL[code] ?? code;
}

export const UI_STATUS_LABEL: Record<ExecutionUiStatus, string> = {
  delivered: 'تحویل‌شده',
  pending: 'در انتظار',
  followup: 'نیازمند پیگیری',
};

export const AREA_EXEC_STATE_LABEL: Record<AreaExecState, string> = {
  'not-started': 'شروع نشده',
  'in-progress': 'در حال اجرا',
  completed: 'تکمیل شده',
};

export const PHASE_STRIP_LABEL: Record<'not-started' | 'in-progress' | 'completed', string> = {
  'not-started': 'شروع نشده',
  'in-progress': 'در حال اجرا',
  completed: 'تکمیل شده',
};

export const SYSTEM_NOTICE_COPY: Record<Exclude<ExecutionSystemNoticeKind, 'none'>, string> = {
  'network-error': 'خطای شبکه — داده‌ها ممکن است قدیمی باشند. اتصال بررسی شود.',
  'server-error': 'خطای سرور — درخواست پردازش نشد. کد ۵۰۳.',
  conflict: 'تعارض نسخه — داده‌ها تغییر کرده‌اند. بارگذاری مجدد لازم است.',
  recovered: 'اتصال برقرار شد — داده‌ها همگام‌سازی شدند.',
};
