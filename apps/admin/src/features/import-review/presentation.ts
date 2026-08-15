import type { StatusTone } from '@/shared/ui';

import type { ReviewIssue, ReviewIssueFilter, ReviewState } from '@/features/import-review/review-types';

export const REVIEW_ISSUE_PRESENTATION: Record<ReviewIssue, { label: string; badgeClass: string }> =
  {
    loc_not_found: { label: 'موقعیت پیدا نشد', badgeClass: 'badge-error' },
    loc_ambiguous: { label: 'مکان‌یابی مبهم', badgeClass: 'badge-error' },
    loc_mismatch: { label: 'ناسازگاری آدرس–موقعیت', badgeClass: 'badge-error' },
    invalid_coords: { label: 'مختصات نامعتبر', badgeClass: 'badge-error' },
    phone: { label: 'شماره تماس نامعتبر', badgeClass: 'badge-info' },
    dup_order_id: { label: 'شماره سفارش تکراری', badgeClass: 'badge-warning' },
    multi_order_location: { label: 'چند سفارش در یک موقعیت', badgeClass: 'badge-neutral' },
  };

export const REVIEW_ISSUE_FILTER_PRESENTATION: Array<{
  key: ReviewIssueFilter;
  label: string;
}> = [
  { key: 'loc_not_found', label: REVIEW_ISSUE_PRESENTATION.loc_not_found.label },
  { key: 'loc_ambiguous', label: REVIEW_ISSUE_PRESENTATION.loc_ambiguous.label },
  { key: 'loc_mismatch', label: REVIEW_ISSUE_PRESENTATION.loc_mismatch.label },
  { key: 'invalid_coords', label: REVIEW_ISSUE_PRESENTATION.invalid_coords.label },
  { key: 'dup_order_id', label: REVIEW_ISSUE_PRESENTATION.dup_order_id.label },
  { key: 'phone', label: 'شماره تماس' },
  { key: 'multiple', label: 'چند مسئله' },
];

export const isActiveReviewIssue = (issue: ReviewIssue) => issue !== 'multi_order_location';

export type ReviewIssueSeverity = 'blocking' | 'review' | 'info';

export const REVIEW_ISSUE_SEVERITY: Record<
  ReviewIssue,
  { severity: ReviewIssueSeverity; label: string; tone: StatusTone }
> = {
  loc_not_found: { severity: 'blocking', label: 'مسدودکننده', tone: 'error' },
  loc_ambiguous: { severity: 'blocking', label: 'مسدودکننده', tone: 'error' },
  loc_mismatch: { severity: 'blocking', label: 'مسدودکننده', tone: 'error' },
  invalid_coords: { severity: 'blocking', label: 'مسدودکننده', tone: 'error' },
  dup_order_id: { severity: 'review', label: 'نیازمند بررسی', tone: 'warning' },
  phone: { severity: 'review', label: 'نیازمند بررسی', tone: 'warning' },
  multi_order_location: { severity: 'info', label: 'اطلاعاتی', tone: 'info' },
};

export const REVIEW_STATE_PRESENTATION: Record<ReviewState, { label: string; tone: StatusTone }> = {
  ready: { label: 'آماده', tone: 'success' },
  review: { label: 'نیازمند بررسی', tone: 'warning' },
  error: { label: 'خطا', tone: 'error' },
  excluded: { label: 'مستثنا', tone: 'neutral' },
};
