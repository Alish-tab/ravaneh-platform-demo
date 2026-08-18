import { useState } from 'react';

import { Button, InlineMessage, LtrData, StatusBadge } from '@/shared/ui';
import { REVIEW_STATE_PRESENTATION } from '@/features/import-review/presentation';
import type { ReviewTask } from '@/features/import-review/review-types';
import { toPersianDigits } from '@/shared/lib/format';

export function BulkReviewInspector({
  tasks,
  onExclude,
  onRestore,
  onClear,
  pending,
  pendingKind,
  readOnly,
}: {
  tasks: ReviewTask[];
  onExclude: (ids: string[]) => Promise<boolean>;
  onRestore: (ids: string[]) => Promise<boolean>;
  onClear: () => void;
  pending: boolean;
  pendingKind?: 'bulk-exclude' | 'bulk-restore';
  readOnly?: boolean;
}) {
  const [confirming, setConfirming] = useState<'exclude' | 'restore' | null>(null);
  const readyCount = tasks.filter((task) => task.state === 'ready').length;
  const actionCount = tasks.filter((task) => task.state === 'review' || task.state === 'error').length;
  const excludedCount = tasks.filter((task) => task.state === 'excluded').length;
  const mixedSelection = readyCount > 0 && actionCount > 0;
  const mixedEligibility = excludedCount > 0 && excludedCount < tasks.length;
  const canExclude = !readOnly && excludedCount < tasks.length;
  const canRestore = !readOnly && excludedCount > 0;
  const excludeIds = tasks.filter((task) => task.state !== 'excluded').map((task) => task.id);
  const restoreIds = tasks.filter((task) => task.state === 'excluded').map((task) => task.id);

  return (
    <aside className="review-inspector">
      <div className="review-inspector-header px-3.5 py-3">
        <strong className="text-[13px]">{toPersianDigits(tasks.length)} مورد انتخاب شده</strong>
        <div className="text-[11.5px] text-[var(--text-secondary)]">انتخاب چندگانه</div>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
        {readOnly ? (
          <InlineMessage tone="info">در نسخه منتشرشده، اقدامات دسته‌جمعی غیرفعال است.</InlineMessage>
        ) : null}
        {confirming === 'exclude' ? (
          <>
            <InlineMessage tone="warning">
              موارد انتخاب‌شده از برنامه‌ریزی خارج می‌شوند و سابقه واردات حفظ خواهد شد.
            </InlineMessage>
            <Button
              variant="destructive"
              loading={pendingKind === 'bulk-exclude'}
              onClick={() => void onExclude(excludeIds)}
            >
              مستثنا کردن {toPersianDigits(excludeIds.length)} مورد
            </Button>
            <Button variant="subtle" disabled={pending} onClick={() => setConfirming(null)}>
              انصراف
            </Button>
          </>
        ) : confirming === 'restore' ? (
          <>
            <InlineMessage tone="info">
              موارد مستثنا به وضعیت متناسب با مسائل فعلی بازمی‌گردند.
            </InlineMessage>
            <Button
              variant="primary"
              loading={pendingKind === 'bulk-restore'}
              onClick={() => void onRestore(restoreIds)}
            >
              بازگرداندن {toPersianDigits(restoreIds.length)} مورد
            </Button>
            <Button variant="subtle" disabled={pending} onClick={() => setConfirming(null)}>
              انصراف
            </Button>
          </>
        ) : (
          <>
            {mixedSelection ? (
              <InlineMessage tone="warning">
                {toPersianDigits(actionCount)} مورد نیازمند بررسی و {toPersianDigits(readyCount)} مورد
                آماده انتخاب شده است.
              </InlineMessage>
            ) : null}
            {mixedEligibility ? (
              <InlineMessage tone="warning">
                انتخاب ترکیبی است؛ فقط موارد واجد شرایط برای هر اقدام استفاده می‌شوند.
              </InlineMessage>
            ) : null}
            <div className="flex flex-col gap-2">
              {tasks.slice(0, 6).map((task) => {
                const state = REVIEW_STATE_PRESENTATION[task.state];
                return (
                  <div key={task.reviewItemId} className="flex items-center gap-1.5">
                    <LtrData className="text-[10.5px] text-[var(--text-muted)]">
                      {task.externalOrderId}
                    </LtrData>
                    <span className="min-w-0 flex-1 truncate text-[11.5px]">{task.name}</span>
                    <StatusBadge tone={state.tone} label={state.label} />
                  </div>
                );
              })}
              {tasks.length > 6 ? (
                <div className="text-[11px] text-[var(--text-muted)]">
                  و {toPersianDigits(tasks.length - 6)} مورد دیگر…
                </div>
              ) : null}
            </div>
            {canExclude ? (
              <Button variant="destructive" onClick={() => setConfirming('exclude')}>
                مستثنا کردن موارد انتخاب‌شده
              </Button>
            ) : null}
            {canRestore ? (
              <Button variant="secondary" onClick={() => setConfirming('restore')}>
                بازگرداندن موارد مستثنا
              </Button>
            ) : null}
            <Button variant="subtle" onClick={onClear}>
              پاک کردن انتخاب
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
