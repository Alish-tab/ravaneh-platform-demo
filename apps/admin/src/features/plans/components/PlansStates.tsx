import { Button } from '@/shared/ui';

import type { A01StageKey } from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { A01_STAGE_LABELS } from '@/features/plans/presentation';

export function PlansEmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <div className="a01-centered">
      <div className="max-w-[340px] px-6 text-center">
        <div className="a01-state-icon mx-auto mb-4">
          <Icon d={ICONS.plans} size={20} />
        </div>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">هنوز برنامه‌ای وجود ندارد</h2>
        <p className="mb-5 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          برنامه تحویل ظرف عملیاتی است که داده‌های تحویل وارد شده، مسیرها و تخصیص رانندگان را در خود نگه
          می‌دارد. برای شروع یک برنامه جدید ایجاد کنید.
        </p>
        <Button variant="primary" onClick={onCreatePlan}>
          <Icon d={ICONS.plus} size={13} />
          برنامه جدید
        </Button>
      </div>
    </div>
  );
}

export function PlansNoResults({
  search,
  stageFilter,
  onClear,
}: {
  search: string;
  stageFilter: A01StageKey | 'all';
  onClear: () => void;
}) {
  return (
    <div className="a01-centered">
      <div className="max-w-[320px] px-6 text-center">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          برنامه‌ای با این فیلتر پیدا نشد
        </h2>
        <p className="mb-4 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          {search ? (
            <>
              جستجو برای «<span className="text-[var(--text-primary)]">{search}</span>»{' '}
            </>
          ) : null}
          {stageFilter !== 'all' ? (
            <>
              در مرحله «{A01_STAGE_LABELS[stageFilter]}»{' '}
            </>
          ) : null}
          نتیجه‌ای برنگرداند. فیلترها را پاک کنید و دوباره امتحان کنید.
        </p>
        <Button variant="secondary" size="sm" onClick={onClear}>
          پاک کردن فیلترها
        </Button>
      </div>
    </div>
  );
}

export function PlansErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="a01-centered">
      <div className="max-w-[320px] px-6 text-center">
        <div className="a01-state-icon a01-state-icon-error mx-auto mb-4">
          <Icon d={ICONS.warning_tri} size={20} />
        </div>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          بارگذاری لیست برنامه‌ها ناموفق بود
        </h2>
        <p className="mb-5 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          <Icon d={ICONS.refresh} size={13} />
          تلاش مجدد
        </Button>
      </div>
    </div>
  );
}

export function PlansLoadingState() {
  return (
    <div className="flex-1 bg-[var(--bg-elevated)]" aria-busy="true" aria-label="در حال بارگذاری">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>نام برنامه</th>
            <th>تاریخ تحویل</th>
            <th>موارد تحویل</th>
            <th>مرحله جاری</th>
            <th>وضعیت</th>
            <th>آخرین تغییر</th>
            <th style={{ width: 32 }} />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td>
                <div className="skeleton" style={{ height: 14, width: `${120 + index * 20}px` }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 12, width: 80 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 12, width: 36 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 18, width: 80 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 18, width: 90, borderRadius: 10 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 12, width: 60 }} />
              </td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
