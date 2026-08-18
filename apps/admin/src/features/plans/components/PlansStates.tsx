import { Button } from '@/shared/ui';

import { Icon, ICONS } from '@/features/plans/components/icons';

export function PlansEmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <div className="plans-centered">
      <div className="max-w-[340px] px-6 text-center">
        <div className="plans-state-icon mx-auto mb-4">
          <Icon d={ICONS.plans} size={20} />
        </div>
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          هنوز برنامه‌ای وجود ندارد
        </h2>
        <p className="mb-5 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          برنامه تحویل ظرف عملیاتی است که داده‌های تحویل وارد شده، مسیرها و تخصیص رانندگان را در خود
          نگه می‌دارد. برای شروع یک برنامه جدید ایجاد کنید.
        </p>
        <Button variant="primary" onClick={onCreatePlan}>
          <Icon d={ICONS.plus} size={13} />
          برنامه جدید
        </Button>
      </div>
    </div>
  );
}

export function PlansNoResults({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <div className="plans-centered">
      <div className="max-w-[320px] px-6 text-center">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          برنامه‌ای با این جستجو پیدا نشد
        </h2>
        <p className="mb-4 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          {search ? (
            <>
              جستجو برای «<span className="text-[var(--text-primary)]">{search}</span>»{' '}
            </>
          ) : null}
          نتیجه‌ای برنگرداند. جستجو را پاک کنید و دوباره امتحان کنید.
        </p>
        <Button variant="secondary" size="sm" onClick={onClear}>
          پاک کردن جستجو
        </Button>
      </div>
    </div>
  );
}

export function PlansAllReadyState({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="plans-centered">
      <div className="max-w-[320px] px-6 text-center">
        <div className="plans-state-icon plans-state-icon-success mx-auto mb-4">
          <Icon d={ICONS.check_circle} size={18} />
        </div>
        <h2 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">
          همه برنامه‌ها آماده‌اند
        </h2>
        <p className="mb-5 text-[12.5px] leading-7 text-[var(--text-secondary)]">
          در حال حاضر برنامه‌ای نیازمند آماده‌سازی نیست.
        </p>
        <Button variant="secondary" size="sm" onClick={onViewAll}>
          مشاهده همه برنامه‌ها
        </Button>
      </div>
    </div>
  );
}

export function PlansErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="plans-centered">
      <div className="max-w-[320px] px-6 text-center">
        <div className="plans-state-icon plans-state-icon-error mx-auto mb-4">
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
            <th className="ps-4">برنامه</th>
            <th>بازه تحویل</th>
            <th>سفارش‌ها</th>
            <th>وضعیت برنامه</th>
            <th>نیازمند اقدام</th>
            <th>آخرین تغییر</th>
            <th style={{ width: 32 }} />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className="ps-4">
                <div className="skeleton" style={{ height: 14, width: `${120 + index * 20}px` }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 12, width: 90 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 12, width: 36 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 18, width: 90, borderRadius: 10 }} />
              </td>
              <td>
                <div className="skeleton" style={{ height: 18, width: 110 }} />
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
