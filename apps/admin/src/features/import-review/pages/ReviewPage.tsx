import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BulkReviewInspector } from '@/features/import-review/components/BulkReviewInspector';
import { ReviewInspector } from '@/features/import-review/components/ReviewInspector';
import { ReviewSummaryToolbar } from '@/features/import-review/components/ReviewSummaryToolbar';
import { ReviewTable } from '@/features/import-review/components/ReviewTable';
import { useReviewFixture } from '@/features/import-review/fixture/useReviewFixture';
import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { toPersianDigits } from '@/shared/lib/format';
import { Button, InlineMessage, Toast } from '@/shared/ui';
import '@/features/import-review/styles/review.css';

export function ReviewPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const plansPort = usePlansDataPort();
  const { plan, status, reload } = usePlan(planId);
  const review = useReviewFixture({ empty: plan?.itemCount === 0 });

  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState(false);

  const continueToPlanning = async () => {
    if (!plan || !review.canContinue) return;

    setContinuing(true);
    setContinueError(false);

    try {
      await plansPort.updatePlan(plan.id, {
        currentStage: 'planning',
        status: 'planning_active',
        lastChanged: 'همین الان',
      });

      navigate(`/plans/${plan.id}/planning`);
    } catch {
      setContinueError(true);
      setContinuing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="info">در حال بارگذاری برنامه…</InlineMessage>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="plan-workspace-page flex flex-col items-start gap-3 p-6">
        <InlineMessage tone="error">بارگذاری برنامه ناموفق بود.</InlineMessage>

        <Button variant="secondary" size="sm" onClick={() => void reload()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (status === 'missing' || !plan) {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="error">برنامه یافت نشد.</InlineMessage>
      </div>
    );
  }

  const pageFeedback = continueError
    ? {
        tone: 'error' as const,
        message: 'ادامه به برنامه‌ریزی انجام نشد.',
        dismiss: () => setContinueError(false),
      }
    : review.feedback
      ? {
          ...review.feedback,
          dismiss: review.clearFeedback,
        }
      : null;

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader plan={plan} />

      <ReviewSummaryToolbar
        activeTab={review.activeTab}
        counts={review.counts}
        issueCounts={review.issueCounts}
        activeIssue={review.activeIssue}
        search={review.search}
        onTabChange={review.setActiveTab}
        onIssueChange={review.setActiveIssue}
        onSearchChange={review.setSearch}
      />

      {pageFeedback ? (
        <div className="review-feedback">
          <Toast
            tone={pageFeedback.tone}
            title={pageFeedback.message}
            onDismiss={pageFeedback.dismiss}
          />
        </div>
      ) : null}

      <div className="review-workspace">
        <ReviewTable
          tasks={review.visibleTasks}
          inspectedId={review.inspectedId}
          checkedIds={review.checkedIds}
          allVisibleChecked={review.allVisibleChecked}
          someVisibleChecked={review.someVisibleChecked}
          emptyMessage={
            review.tasks.length === 0
              ? 'این برنامه موردی برای بررسی ندارد.'
              : review.search || review.activeIssue
                ? 'موردی با جستجو یا فیلتر فعلی پیدا نشد.'
                : 'موردی در این بخش وجود ندارد.'
          }
          isDatasetEmpty={review.tasks.length === 0}
          onClearFilters={
            review.search || review.activeIssue
              ? () => {
                  review.setSearch('');
                  review.setActiveIssue(null);
                }
              : undefined
          }
          onInspect={(task) =>
            review.setInspectedId(
              review.inspectedId === task.id ? null : task.id,
            )
          }
          onToggleChecked={review.toggleChecked}
          onToggleAllVisible={review.toggleAllVisible}
        />

        {review.checkedTasks.length > 1 ? (
          <BulkReviewInspector
            tasks={review.checkedTasks}
            onExclude={review.exclude}
            onClear={review.clearChecked}
            pending={review.pendingAction?.kind === 'bulk-exclude'}
          />
        ) : (
          <ReviewInspector
            task={review.inspectedTask}
            pendingKind={review.pendingAction?.kind}
            onResolveLocation={review.resolveLocation}
            onEditInformation={review.editInformation}
            onResolveDuplicate={review.resolveDuplicate}
            onExclude={(id) => review.exclude([id])}
            onRestore={review.restore}
          />
        )}
      </div>

      <footer className="review-progress">
        <div className="flex flex-1 items-center gap-[7px] text-[12.5px] text-[var(--text-secondary)]">
          <span
            className={
              review.canContinue
                ? 'text-[var(--success-text)]'
                : 'text-[var(--warning-text)]'
            }
          >
            <Icon
              d={review.canContinue ? ICONS.check : ICONS.alert}
              size={13}
            />
          </span>

          {review.canContinue ? (
            <span className="text-[var(--success-text)]">
              همه موارد الزامی بررسی شدند. مجموعه داده آماده برنامه‌ریزی است.
            </span>
          ) : (
            <span>
              <strong className="text-[var(--warning-text)]">
                {toPersianDigits(review.counts.action)} مورد
              </strong>{' '}
              نیازمند اقدام باقی مانده است
            </span>
          )}

          {!review.canContinue ? (
            <span className="text-[11.5px] text-[var(--text-muted)] max-[1040px]:hidden">
              · تا رفع همه موارد، ادامه غیرفعال است.
            </span>
          ) : null}
        </div>

        <Button
          variant={review.canContinue ? 'primary' : 'secondary'}
          disabled={!review.canContinue || continuing}
          loading={continuing}
          onClick={() => void continueToPlanning()}
        >
          تأیید و ادامه به برنامه‌ریزی
        </Button>
      </footer>
    </div>
  );
}