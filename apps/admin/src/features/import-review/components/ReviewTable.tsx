import { Icon, ICONS } from '@/features/plans/components/icons';
import { toPersianDigits } from '@/shared/lib/format';
import { Button, Checkbox, LtrData, StatusBadge } from '@/shared/ui';

import {
  REVIEW_ISSUE_PRESENTATION,
  REVIEW_STATE_PRESENTATION,
} from '@/features/import-review/presentation';
import type { ReviewIssue, ReviewTask } from '@/features/import-review/review-types';

function IssueBadge({ issue }: { issue: ReviewIssue }) {
  const presentation = REVIEW_ISSUE_PRESENTATION[issue];
  return <span className={`badge ${presentation.badgeClass}`}>{presentation.label}</span>;
}

type ReviewTableProps = {
  tasks: ReviewTask[];
  inspectedId: string | null;
  checkedIds: string[];
  allVisibleChecked: boolean;
  someVisibleChecked: boolean;
  emptyMessage: string;
  isDatasetEmpty: boolean;
  onClearFilters?: () => void;
  onInspect: (task: ReviewTask) => void;
  onToggleChecked: (id: string) => void;
  onToggleAllVisible: () => void;
};

export function ReviewTable({
  tasks,
  inspectedId,
  checkedIds,
  allVisibleChecked,
  someVisibleChecked,
  emptyMessage,
  isDatasetEmpty,
  onClearFilters,
  onInspect,
  onToggleChecked,
  onToggleAllVisible,
}: ReviewTableProps) {
  if (isDatasetEmpty)
    return (
      <div className="review-table-pane review-empty-state">
        <span className="text-[var(--text-disabled)]" aria-hidden>
          <Icon d={ICONS.file} size={28} />
        </span>
        <div className="text-center">
          <strong className="block text-sm">مجموعه داده خالی است</strong>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">
            هیچ سطری از فایل واردشده برای بررسی وجود ندارد.
          </span>
        </div>
      </div>
    );

  return (
    <div className="review-table-pane">
      <div className="review-table-scroll">
        <table className="data-table review-table">
          <thead>
            <tr>
              <th>
                <Checkbox
                  aria-label="انتخاب همه موارد قابل مشاهده"
                  checked={allVisibleChecked}
                  aria-checked={someVisibleChecked && !allVisibleChecked ? 'mixed' : allVisibleChecked}
                  disabled={tasks.length === 0}
                  onChange={onToggleAllVisible}
                />
              </th>
              <th>کد</th>
              <th>گیرنده</th>
              <th>شماره تماس</th>
              <th>آدرس</th>
              <th>موقعیت</th>
              <th>مسائل</th>
              <th>وضعیت بررسی</th>
              <th aria-label="اقدامات" />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="!py-8 text-center !text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <span>{emptyMessage}</span>
                    {onClearFilters ? <Button variant="subtle" size="sm" onClick={onClearFilters}>پاک کردن فیلترها</Button> : null}
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const presentation = REVIEW_STATE_PRESENTATION[task.state];
                const inspected = inspectedId === task.id;
                const rowTone =
                  task.state === 'error'
                    ? 'row-error'
                    : task.state === 'review'
                      ? 'row-warning'
                      : 'row-normal';
                return (
                  <tr
                    key={task.id}
                    className={
                      inspected && task.state === 'error'
                        ? 'row-selected row-selected-error'
                        : inspected && task.state === 'review'
                          ? 'row-selected row-selected-warning'
                          : inspected
                            ? 'row-selected'
                            : rowTone
                    }
                    onClick={() => onInspect(task)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onInspect(task);
                      }
                    }}
                    tabIndex={0}
                    aria-selected={inspected}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        aria-label={`انتخاب ${task.id}`}
                        checked={checkedIds.includes(task.id)}
                        onChange={() => onToggleChecked(task.id)}
                      />
                    </td>
                    <td>
                      <LtrData className="text-[11.5px] text-[var(--text-muted)]">
                        {task.id}
                      </LtrData>
                    </td>
                    <td className="font-medium">{task.name}</td>
                    <td>
                      <LtrData
                        className={
                          task.issues.includes('phone') ? 'text-[var(--warning-text)]' : ''
                        }
                      >
                        {task.phone}
                      </LtrData>
                    </td>
                    <td className="truncate" title={task.address}>
                      {task.address}
                    </td>
                    <td>
                      {task.coordinates ? (
                        <span className="review-location review-location--ready">
                          <Icon d={ICONS.map_pin} size={11} />
                          <LtrData>{task.coordinates}</LtrData>
                        </span>
                      ) : (
                        <span className="review-location review-location--error">
                          <Icon d={ICONS.map_pin} size={11} />
                          {task.issues.includes('invalid_coords') ? 'نامعتبر' : 'پیدا نشد'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-[3px] text-[var(--text-disabled)]">
                        {task.issues.length
                          ? task.issues.map((issue) => <IssueBadge key={issue} issue={issue} />)
                          : '—'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge tone={presentation.tone} label={presentation.label} />
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        className="!p-1"
                        aria-label={`مشاهده جزئیات ${task.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onInspect(task);
                        }}
                      >
                        <Icon d={ICONS.menu_dots} size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="review-table-footer">
        {toPersianDigits(tasks.length)} مورد نمایش داده می‌شود
        {checkedIds.length ? (
          <span className="ms-auto rounded-[var(--r-xs)] border border-[rgba(61,123,212,0.25)] bg-[var(--accent-dim)] px-[7px] py-px text-[var(--accent-text)]">
            {toPersianDigits(checkedIds.length)} مورد انتخاب شده
          </span>
        ) : null}
      </div>
    </div>
  );
}
