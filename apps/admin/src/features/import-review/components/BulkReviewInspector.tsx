import { useState } from 'react';

import { Button, InlineMessage, LtrData, StatusBadge } from '@/shared/ui';
import { REVIEW_STATE_PRESENTATION } from '@/features/import-review/presentation';
import type { ReviewTask } from '@/features/import-review/review-types';
import { toPersianDigits } from '@/shared/lib/format';

export function BulkReviewInspector({
  tasks,
  onExclude,
  onClear,
  pending,
}: {
  tasks: ReviewTask[];
  onExclude: (ids: string[]) => Promise<boolean>;
  onClear: () => void;
  pending: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const readyCount = tasks.filter((task) => task.state === 'ready').length;
  const actionCount = tasks.filter((task) => task.state === 'review' || task.state === 'error').length;
  const mixedSelection = readyCount > 0 && actionCount > 0;
  return (
    <aside className="review-inspector">
      <div className="review-inspector-header px-3.5 py-3">
        <strong className="text-[13px]">{toPersianDigits(tasks.length)} مورد انتخاب شده</strong>
        <div className="text-[11.5px] text-[var(--text-secondary)]">انتخاب چندگانه</div>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto p-3.5">
        {confirming ? (
          <>
            <InlineMessage tone="warning">
              موارد انتخاب‌شده از برنامه‌ریزی خارج می‌شوند و قابل بازگرداندن خواهند بود.
            </InlineMessage>
            <Button variant="destructive" loading={pending} onClick={() => void onExclude(tasks.map((task) => task.id))}>
              مستثنا کردن {toPersianDigits(tasks.length)} مورد
            </Button>
            <Button variant="subtle" disabled={pending} onClick={() => setConfirming(false)}>
              انصراف
            </Button>
          </>
        ) : (
          <>
            {mixedSelection ? (
              <InlineMessage tone="warning">
                {toPersianDigits(actionCount)} مورد نیازمند بررسی و {toPersianDigits(readyCount)} مورد آماده انتخاب شده است.
              </InlineMessage>
            ) : null}
            <div className="flex flex-col gap-2">
              {tasks.slice(0, 6).map((task) => {
                const state = REVIEW_STATE_PRESENTATION[task.state];
                return (
                  <div key={task.id} className="flex items-center gap-1.5">
                    <LtrData className="text-[10.5px] text-[var(--text-muted)]">{task.id}</LtrData>
                    <span className="min-w-0 flex-1 truncate text-[11.5px]">{task.name}</span>
                    <StatusBadge tone={state.tone} label={state.label} />
                  </div>
                );
              })}
              {tasks.length > 6 ? <div className="text-[11px] text-[var(--text-muted)]">و {toPersianDigits(tasks.length - 6)} مورد دیگر…</div> : null}
            </div>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              مستثنا کردن موارد انتخاب‌شده
            </Button>
            <Button variant="subtle" onClick={onClear}>
              پاک کردن انتخاب
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
