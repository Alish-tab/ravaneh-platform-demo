import { toPersianDigits } from '@/shared/lib/format';
import { Button, Input } from '@/shared/ui';

import type { PlansListView } from '@/features/plans/a01-types';
import { Icon, ICONS } from '@/features/plans/components/icons';

type PlansToolbarProps = {
  search: string;
  onSearch: (value: string) => void;
  view: PlansListView;
  onView: (value: PlansListView) => void;
  onCreatePlan: () => void;
  preparingCount: number;
  allCount: number;
};

export function PlansToolbar({
  search,
  onSearch,
  view,
  onView,
  onCreatePlan,
  preparingCount,
  allCount,
}: PlansToolbarProps) {
  const views: { key: PlansListView; label: string; count: number }[] = [
    { key: 'preparing', label: 'در حال آماده‌سازی', count: preparingCount },
    { key: 'all', label: 'همه برنامه‌ها', count: allCount },
  ];

  return (
    <div className="plans-toolbar">
      <div className="plans-view-tabs" role="tablist" aria-label="نمای برنامه‌ها">
        {views.map((opt) => {
          const selected = view === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={['plans-view-tab', selected ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={() => onView(opt.key)}
            >
              {opt.label}
              <span className={['plans-count-pill', selected ? 'active' : ''].filter(Boolean).join(' ')}>
                {toPersianDigits(opt.count)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="plans-toolbar-divider" />

      <div className="input-wrap w-[200px] self-center">
        <Input
          className="input-search h-7 text-xs"
          placeholder="جستجو — نام یا شناسه…"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          aria-label="جستجوی برنامه‌ها"
        />
        <span className="input-icon-end">
          <Icon d={ICONS.search} size={12} />
        </span>
      </div>

      <div className="ms-auto flex items-center">
        <Button variant="primary" size="sm" onClick={onCreatePlan}>
          <Icon d={ICONS.plus} size={12} />
          برنامه جدید
        </Button>
      </div>
    </div>
  );
}
