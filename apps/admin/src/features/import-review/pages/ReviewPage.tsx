import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BulkReviewInspector } from '@/features/import-review/components/BulkReviewInspector';
import { ReviewInspector } from '@/features/import-review/components/ReviewInspector';
import { ReviewLocationDialog } from '@/features/import-review/components/ReviewLocationDialog';
import { ReviewSummaryToolbar } from '@/features/import-review/components/ReviewSummaryToolbar';
import { ReviewTable } from '@/features/import-review/components/ReviewTable';
import { useReviewFixture } from '@/features/import-review/fixture/useReviewFixture';
import {
  canMutateReview,
  isHistoricalReviewView,
  isPublishedReviewView,
} from '@/features/import-review/review-model';
import type { ReviewTask } from '@/features/import-review/review-types';
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
  const review = useReviewFixture(plan);

  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState(false);
  const [creatingWorking, setCreatingWorking] = useState(false);
  const [locationTask, setLocationTask] = useState<ReviewTask | null>(null);

  const continueToPlanning = () => {
    if (!plan || !review.canContinue) return;
    setContinuing(true);
    setContinueError(false);
    navigate(`/plans/${plan.id}/planning`);
  };

  const createWorkingVersion = async () => {
    if (!plan) return;
    setCreatingWorking(true);
    try {
      await plansPort.createWorkingVersion(plan.id);
    } finally {
      setCreatingWorking(false);
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

  if (review.loadStatus === 'loading') {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="info">در حال بارگذاری بررسی…</InlineMessage>
      </div>
    );
  }

  if (review.loadStatus === 'error') {
    return (
      <div className="plan-workspace-page flex flex-col items-start gap-3 p-6">
        <InlineMessage tone="error">بارگذاری برنامه ناموفق بود.</InlineMessage>
        <Button variant="secondary" size="sm" onClick={() => void review.reload()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const publishedView = isPublishedReviewView(plan);
  const historicalView = isHistoricalReviewView(plan);
  const readOnly = !canMutateReview(plan);
  const stale = plansPort.isStale(plan.id);
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

  const allResolved = review.tasks.length > 0 && review.counts.action === 0;

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader plan={plan} />

      {publishedView ? (
        <div className="review-version-banner review-version-banner--published" role="status">
          <span>نسخه منتشرشده · فقط مشاهده</span>
          {plan.lifecycle === 'published' || plan.lifecycle === 'readyToPublish' ? (
            <Button variant="subtle" size="sm" loading={creatingWorking} onClick={() => void createWorkingVersion()}>
              ایجاد نسخه کاری
            </Button>
          ) : null}
        </div>
      ) : null}

      {plan.a01Mode === 'working' ? (
        <div className="review-version-banner review-version-banner--working" role="status">
          نسخه در حال ویرایش · تغییرات تا انتشار برای راننده‌ها دیده نمی‌شود.
        </div>
      ) : null}

      {historicalView ? (
        <div className="review-version-banner" role="status">
          این برنامه تاریخی/در حال اجرا است و بررسی فقط خواندنی است.
        </div>
      ) : null}

      {stale ? (
        <div className="review-version-banner review-version-banner--stale" role="status">
          <span>اطلاعات این صفحه قدیمی است. اطلاعات جدید را دریافت کنید.</span>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              plansPort.markStale(plan.id, false);
              void reload();
              void review.reload();
            }}
          >
            دریافت اطلاعات جدید
          </Button>
        </div>
      ) : null}

      {review.conflict ? (
        <div className="review-version-banner review-version-banner--conflict" role="alert">
          این مورد در جای دیگری تغییر کرده است. اطلاعات جدید را دریافت کنید.
          <Button variant="subtle" size="sm" onClick={() => void review.reload()}>
            دریافت اطلاعات جدید
          </Button>
        </div>
      ) : null}

      <ReviewSummaryToolbar
        activeTab={review.activeTab}
        counts={review.counts}
        issueCounts={review.issueCounts}
        activeIssues={review.activeIssues}
        search={review.search}
        recentOnly={review.recentOnly}
        recentCount={review.recentCount}
        onTabChange={review.setActiveTab}
        onToggleIssue={review.toggleIssue}
        onSearchChange={review.setSearch}
        onClearFilters={review.clearFilters}
        onShowRecent={() => {
          review.setActiveTab('all');
          review.setRecentOnly(true);
        }}
        onClearRecent={() => review.setRecentOnly(false)}
      />

      {allResolved ? (
        <div className="review-resolved-notice" role="status">
          مورد نیازمند بررسی باقی نمانده است. بخش بررسی همچنان در دسترس است.
        </div>
      ) : null}

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
              : review.hasActiveFilters
                ? 'موردی با جستجو یا فیلتر فعلی پیدا نشد.'
                : 'موردی در این بخش وجود ندارد.'
          }
          isDatasetEmpty={review.tasks.length === 0}
          pendingIds={review.pendingAction?.ids ?? []}
          failedIds={
            review.feedback?.tone === 'error' && review.pendingAction === null
              ? []
              : []
          }
          recentlyResolvedIds={review.recentlyResolvedIds}
          onClearFilters={review.hasActiveFilters ? review.clearFilters : undefined}
          onInspect={(task) =>
            review.setInspectedId(review.inspectedId === task.id ? null : task.id)
          }
          onToggleChecked={review.toggleChecked}
          onToggleAllVisible={review.toggleAllVisible}
        />

        {review.checkedTasks.length > 1 ? (
          <BulkReviewInspector
            tasks={review.checkedTasks}
            onExclude={review.exclude}
            onRestore={review.restoreMany}
            onClear={review.clearChecked}
            pending={
              review.pendingAction?.kind === 'bulk-exclude' ||
              review.pendingAction?.kind === 'bulk-restore'
            }
            pendingKind={
              review.pendingAction?.kind === 'bulk-exclude' ||
              review.pendingAction?.kind === 'bulk-restore'
                ? review.pendingAction.kind
                : undefined
            }
            readOnly={readOnly}
          />
        ) : (
          <ReviewInspector
            key={review.inspectedTask?.reviewItemId ?? 'empty'}
            task={review.inspectedTask}
            allTasks={review.tasks}
            pendingKind={review.pendingAction?.kind}
            saveFailed={review.feedback?.tone === 'error'}
            readOnly={readOnly}
            onOpenLocation={setLocationTask}
            onEditInformation={review.editInformation}
            onResolveDuplicate={review.resolveDuplicate}
            onExclude={(id) => review.exclude([id])}
            onRestore={review.restore}
          />
        )}
      </div>

      {locationTask ? (
        <ReviewLocationDialog
          key={locationTask.id}
          task={locationTask}
          pending={review.pendingAction?.kind === 'location'}
          onConfirm={review.resolveLocation}
          onCancel={() => setLocationTask(null)}
        />
      ) : null}

      <footer className="review-progress">
        <div className="flex flex-1 items-center gap-[7px] text-[12.5px] text-[var(--text-secondary)]">
          <span
            className={review.canContinue ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}
          >
            <Icon d={review.canContinue ? ICONS.check : ICONS.alert} size={13} />
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
          onClick={continueToPlanning}
        >
          تأیید و ادامه به برنامه‌ریزی
        </Button>
      </footer>
    </div>
  );
}
