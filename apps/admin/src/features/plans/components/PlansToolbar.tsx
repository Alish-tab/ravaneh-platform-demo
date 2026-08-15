import { toPersianDigits } from '@/shared/lib/format';
import { Button, Input } from '@/shared/ui';

import type { A01StageKey } from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { A01_STAGE_FILTER_OPTIONS } from '@/features/plans/presentation';

type PlansToolbarProps = {
  search: string;
  onSearch: (value: string) => void;
  stageFilter: A01StageKey | 'all';
  onStageFilter: (value: A01StageKey | 'all') => void;
  onCreatePlan: () => void;
  totalCount: number;
  filteredCount: number;
};

export function PlansToolbar({
  search,
  onSearch,
  stageFilter,
  onStageFilter,
  onCreatePlan,
  totalCount,
  filteredCount,
}: PlansToolbarProps) {
  const filtered = search.trim().length > 0 || stageFilter !== 'all';

  return (
    <div className="plans-toolbar">
      <div className="shrink-0">
        <h1 className="text-[15px] leading-tight font-bold tracking-tight text-[var(--text-primary)]">
          برنامه‌ها
        </h1>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
          {filtered
            ? `${toPersianDigits(filteredCount)} از ${toPersianDigits(totalCount)} برنامه`
            : `${toPersianDigits(totalCount)} برنامه`}
        </p>
      </div>

      <div className="plans-toolbar-divider" />

      <div className="input-wrap w-[220px]">
        <Input
          className="input-search h-[30px] text-xs"
          placeholder="جستجو — نام یا شناسه…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          aria-label="جستجوی برنامه‌ها"
        />
        <span className="input-icon-end">
          <Icon d={ICONS.search} size={12} />
        </span>
      </div>

      <div className="seg-control" role="group" aria-label="فیلتر مرحله">
        {A01_STAGE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={['seg-opt', stageFilter === opt.key ? 'active' : '']
              .filter(Boolean)
              .join(' ')}
            aria-pressed={stageFilter === opt.key}
            onClick={() => onStageFilter(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="ms-auto">
        <Button variant="primary" size="sm" onClick={onCreatePlan}>
          <Icon d={ICONS.plus} size={12} />
          برنامه جدید
        </Button>
      </div>
    </div>
  );
}
