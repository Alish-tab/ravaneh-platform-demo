import { toPersianDigits } from '@/shared/lib/format';

import type { PlanningRoutePlanState } from '@/features/planning/fixture/types';

/** Presentation labels for fixture planState — not domain contracts. */
export const PLANNING_ROUTE_STATE_LABEL: Record<PlanningRoutePlanState, string> = {
  draft: 'پیش‌نویس',
  assigned: 'تخصیص داده شده',
  modified: 'اصلاح‌شده',
  published: 'منتشرشده',
};

export const PLANNING_ROUTE_STATE_COLOR: Record<PlanningRoutePlanState, string> = {
  draft: 'var(--text-muted)',
  assigned: 'var(--success-text)',
  modified: 'var(--warning-text)',
  published: 'var(--accent-text)',
};

export function formatDurationMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${toPersianDigits(m)} دقیقه`;
  if (m === 0) return `${toPersianDigits(h)} ساعت`;
  return `${toPersianDigits(h)} ساعت و ${toPersianDigits(m)} دقیقه`;
}
