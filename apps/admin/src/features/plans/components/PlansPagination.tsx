import { toPersianDigits } from '@/shared/lib/format';

import { Icon, ICONS } from '@/features/plans/components/icons';

type PlansPaginationProps = {
  page: number;
  pageCount: number;
  startItem: number;
  endItem: number;
  totalItems: number;
  onPage: (page: number) => void;
};

function pageItems(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const items: Array<number | '…'> = [1];
  if (page > 4) items.push('…');
  for (let n = Math.max(2, page - 2); n <= Math.min(pageCount - 1, page + 2); n += 1) {
    items.push(n);
  }
  if (page < pageCount - 3) items.push('…');
  items.push(pageCount);
  return items;
}

export function PlansPagination({
  page,
  pageCount,
  startItem,
  endItem,
  totalItems,
  onPage,
}: PlansPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav className="plans-pagination" aria-label="صفحه‌بندی برنامه‌ها">
      <span className="text-[11.5px] whitespace-nowrap text-[var(--text-muted)]">
        {toPersianDigits(startItem)}–{toPersianDigits(endItem)} از {toPersianDigits(totalItems)} برنامه
      </span>
      <div className="pager">
        <button
          type="button"
          className="page-btn"
          disabled={page === 1}
          aria-label="صفحه قبل"
          onClick={() => onPage(page - 1)}
        >
          <Icon d={ICONS.chevron_r} size={11} />
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === '…' ? (
            <span key={`ellipsis-${index}`} className="px-0.5 text-xs text-[var(--text-disabled)]">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={['page-btn', item === page ? 'active' : ''].filter(Boolean).join(' ')}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`صفحه ${toPersianDigits(item)}`}
              onClick={() => onPage(item)}
            >
              {toPersianDigits(item)}
            </button>
          ),
        )}
        <button
          type="button"
          className="page-btn"
          disabled={page === pageCount}
          aria-label="صفحه بعد"
          onClick={() => onPage(page + 1)}
        >
          <Icon d={ICONS.chevron_l} size={11} />
        </button>
      </div>
    </nav>
  );
}
