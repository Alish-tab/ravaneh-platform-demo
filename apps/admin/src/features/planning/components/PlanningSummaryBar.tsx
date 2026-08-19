import type { ReactNode } from 'react';
import {
  countPlanOrders,
  countPlanStops,
} from '@/features/planning/fixture/planning-fixture';
import {
  countRemainingUnassignedOrders,
  type ExcludedOrderIdSet,
} from '@/features/planning/fixture/exclude-order';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import {
  isGenerationBusy,
  type PlanningGenerationPhase,
} from '@/features/planning/generation';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { Button } from '@/shared/ui';
import { toPersianDigits } from '@/shared/lib/format';

type PlanningSummaryBarProps = {
  fixture: PlanningPlanFixture;
  excludedOrderIds?: ExcludedOrderIdSet;
  phase: PlanningGenerationPhase;
  targetAreaCount: number;
  onTargetAreaCountChange: (count: number) => void;
  onStartGeneration: () => void;
  generatedActions?: ReactNode;
};

export function PlanningSummaryBar({
  fixture,
  excludedOrderIds = new Set(),
  phase,
  targetAreaCount,
  onTargetAreaCountChange,
  onStartGeneration,
  generatedActions,
}: PlanningSummaryBarProps) {
  const orderCount = countPlanOrders(fixture);
  const stopCount = countPlanStops(fixture);
  const remainingUnassigned = countRemainingUnassignedOrders(fixture, excludedOrderIds);
  const areasGenerated = phase === 'generated';
  const busy = isGenerationBusy(phase);
  const canEditTarget = phase === 'ready' || phase === 'failed';

  return (
    <div className="planning-summary" aria-label="خلاصه برنامه‌ریزی">
      <div className="planning-summary-meta">
        {areasGenerated ? (
          <>
            <span className="planning-summary-item">
              {toPersianDigits(orderCount)} سفارش
            </span>
            <span className="planning-summary-sep" aria-hidden />
            <span className="planning-summary-item">
              {toPersianDigits(fixture.areas.length)} محدوده
            </span>
            <span className="planning-summary-sep" aria-hidden />
            <span className="planning-summary-item planning-summary-item--muted">
              {toPersianDigits(stopCount)} نقطه
            </span>
            {fixture.depot ? (
              <>
                <span className="planning-summary-sep" aria-hidden />
                <span className="planning-summary-item planning-summary-item--muted">
                  <span className="planning-summary-label">مبدأ: </span>
                  {fixture.depot.name}
                </span>
              </>
            ) : null}
            {remainingUnassigned > 0 ? (
              <>
                <span className="planning-summary-sep" aria-hidden />
                <span
                  className="planning-summary-item planning-summary-item--warn"
                  data-testid="summary-remaining-unassigned"
                >
                  {toPersianDigits(remainingUnassigned)} بدون محدوده
                </span>
              </>
            ) : null}
          </>
        ) : (
          <>
            <span className="planning-summary-item">
              {toPersianDigits(areasGenerated ? orderCount : fixture.eligibleOrderCount || orderCount)} سفارش آماده
            </span>
            <span className="planning-summary-sep" aria-hidden />
            <label className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
              تعداد محدوده‌ها:
              {canEditTarget ? (
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={targetAreaCount}
                  data-testid="target-area-count"
                  className="planning-target-area-input"
                  onChange={(event) => {
                    const next = Number(event.target.value) || 1;
                    onTargetAreaCountChange(Math.max(1, Math.min(99, next)));
                  }}
                />
              ) : (
                <span className="text-[12.5px] font-semibold text-[var(--text-disabled)]">
                  {toPersianDigits(targetAreaCount)}
                </span>
              )}
            </label>
            {fixture.depot ? (
              <>
                <span className="planning-summary-sep" aria-hidden />
                <span className="planning-summary-item planning-summary-item--muted">
                  <span className="planning-summary-label">مبدأ: </span>
                  {fixture.depot.name}
                </span>
              </>
            ) : null}
          </>
        )}
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-1.5">
        {busy ? (
          <div
            className="planning-generation-pill"
            data-testid="generation-busy-pill"
          >
            <span className="planning-generation-pill-spinner" aria-hidden />
            در حال ساخت محدوده‌ها…
          </div>
        ) : null}

        {phase === 'ready' ? (
          <Button
            variant="primary"
            size="sm"
            data-testid="start-generation"
            onClick={onStartGeneration}
          >
            ساخت محدوده‌های توزیع
          </Button>
        ) : null}

        {generatedActions}

        {phase === 'failed' ? (
          <>
            <div className="planning-generation-fail-chip" data-testid="generation-fail-chip">
              <Icon d={ICONS.error_x} size={11} stroke="var(--error-text)" />
              ساخت ناموفق بود
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="start-generation-retry"
              onClick={onStartGeneration}
            >
              تلاش مجدد
            </Button>
          </>
        ) : null}
      </div>

      {busy ? <div className="planning-generation-top-progress" aria-hidden /> : null}
    </div>
  );
}
