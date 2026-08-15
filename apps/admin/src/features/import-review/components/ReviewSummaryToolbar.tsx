import { Icon, ICONS } from '@/features/plans/components/icons';
import { toPersianDigits } from '@/shared/lib/format';
import { Button, Input } from '@/shared/ui';

import { REVIEW_ISSUE_FILTER_PRESENTATION } from '@/features/import-review/presentation';
import type { ReviewIssueFilter, ReviewTab } from '@/features/import-review/review-types';

type ReviewSummaryToolbarProps = {
  activeTab: ReviewTab;
  counts: Record<ReviewTab, number>;
  activeIssue: ReviewIssueFilter | null;
  issueCounts: Record<ReviewIssueFilter, number>;
  search: string;
  onTabChange: (tab: ReviewTab) => void;
  onIssueChange: (issue: ReviewIssueFilter | null) => void;
  onSearchChange: (value: string) => void;
};

const SUMMARY_ITEMS: Array<{ key: ReviewTab; label: string; tone: string }> = [
  { key: 'all', label: 'کل', tone: 'all' },
  { key: 'ready', label: 'آماده', tone: 'ready' },
  { key: 'action', label: 'نیازمند اقدام', tone: 'review' },
  { key: 'excluded', label: 'مستثنا', tone: 'excluded' },
];

export function ReviewSummaryToolbar({
  activeTab,
  counts,
  activeIssue,
  issueCounts,
  search,
  onTabChange,
  onIssueChange,
  onSearchChange,
}: ReviewSummaryToolbarProps) {
  return (
    <>
      <div className="review-summary" aria-label="خلاصه بررسی">
        {SUMMARY_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={activeTab === item.key}
            className={['review-summary-item', activeTab === item.key ? 'active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onTabChange(item.key)}
          >
            <span className={`review-summary-value review-summary-value--${item.tone}`}>
              {toPersianDigits(counts[item.key])}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="review-filterbar">
        <div className="review-filter-list" aria-label="فیلتر مسائل" role="group">
          {REVIEW_ISSUE_FILTER_PRESENTATION.map((filter) => (
            <Button
              key={filter.key}
              variant="subtle"
              size="sm"
              aria-pressed={activeIssue === filter.key}
              className={['review-filter-chip', activeIssue === filter.key ? 'active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onIssueChange(activeIssue === filter.key ? null : filter.key)}
            >
              {filter.label} ({toPersianDigits(issueCounts[filter.key])})
            </Button>
          ))}
          <span className="review-filter-info" title="یک مورد می‌تواند بیش از یک مسئله داشته باشد." aria-label="یک مورد می‌تواند بیش از یک مسئله داشته باشد.">
            <Icon d={ICONS.info} size={11} />
          </span>
        </div>

        {activeIssue || search ? (
          <Button
            variant="ghost"
            size="sm"
            className="review-clear-filters"
            onClick={() => {
              onIssueChange(null);
              onSearchChange('');
            }}
          >
            × پاک کردن
          </Button>
        ) : null}

        <div className="input-wrap review-search">
          <Input
            type="search"
            className="input-search h-7 text-xs"
            aria-label="جستجوی موارد بررسی"
            placeholder="کد / نام / تلفن / آدرس…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search ? (
            <Button variant="ghost" size="sm" iconOnly className="input-icon-end review-search-clear" aria-label="پاک کردن جستجو" onClick={() => onSearchChange('')}>
              <Icon d={ICONS.close} size={11} />
            </Button>
          ) : (
            <span className="input-icon-end"><Icon d={ICONS.search} size={12} /></span>
          )}
        </div>
      </div>
    </>
  );
}
