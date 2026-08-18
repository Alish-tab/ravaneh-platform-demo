import { NavLink, useMatch } from 'react-router-dom';

import { LtrData, StatusBadge, type StatusTone } from '@/shared/ui';

import type { A01PlanViewModel, A01StageKey } from '@/features/plans/a01-types';
import type { A01PresentationStatus } from '@/features/plans/a01-types';

type PlanContextHeaderProps = {
  plan: A01PlanViewModel;
};

const PLAN_SECTION_LABELS: Record<A01StageKey, string> = {
  intake: 'داده‌های برنامه',
  review: 'بررسی داده',
  planning: 'برنامه‌ریزی و تخصیص',
  execution: 'اجرا و پیگیری',
};

function isStageKey(stage: unknown): stage is A01StageKey {
  return stage === 'intake' || stage === 'review' || stage === 'planning' || stage === 'execution';
}

type PlanLifecyclePresentation = {
  tone: StatusTone;
  label: string;
  pulse?: boolean;
};

/**
 * Temporary lifecycle compatibility mapping.
 * Plan lifecycle is separate from the active section.
 *
 * We intentionally do NOT treat legacy `plan.status` as a canonical lifecycle model.
 * This helper stays feature-local until the Programs migration / OpenAPI provides
 * a proper lifecycle field.
 */
function temporaryLifecyclePresentationFromLegacyStatus(
  status: A01PresentationStatus,
): PlanLifecyclePresentation {
  switch (status) {
    case 'draft':
      return { tone: 'neutral', label: 'پیش‌نویس' };
    case 'ready':
      return { tone: 'success', label: 'آماده انتشار' };
    case 'planning_active':
      return { tone: 'accent', label: 'منتشرشده / آماده اجرا', pulse: true };
    case 'active':
      return { tone: 'accent', label: 'در حال اجرا', pulse: true };
    case 'done':
      return { tone: 'success', label: 'تکمیل‌شده' };
    default:
      // uploading/process/review/intake_failed etc. remain “not yet in lifecycle”.
      return { tone: 'neutral', label: 'پیش‌نویس' };
  }
}

/**
 * Plan workspace stage header.
 * Section strip is workspace navigation — not global app navigation.
 * Breadcrumb back to Plans lives in GlobalTopContext.
 */
export function PlanContextHeader({ plan }: PlanContextHeaderProps) {
  const routeMatch = useMatch('/plans/:planId/:stage');
  const routeStage = routeMatch?.params.stage;
  const activeSection = isStageKey(routeStage) ? routeStage : null;

  const lifecycle = temporaryLifecyclePresentationFromLegacyStatus(plan.status);

  // A04 (Execution) route/page is not yet restored in the current working tree.
  // Prevent a broken navigation/404 by disabling the Execution tab until it exists.
  const executionTabEnabled = false;

  return (
    <div className="plan-context-header">
      <div className="plan-context-header-meta">
        <div>
          <div className="text-[12.5px] leading-tight font-semibold text-[var(--text-primary)]">
            {plan.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <LtrData className="text-[10px] text-[var(--text-muted)]">{plan.id}</LtrData>
            <span className="text-[11px] text-[var(--border-default)]">·</span>
            <LtrData className="text-[10px] text-[var(--text-secondary)]">
              {plan.deliveryDate}
            </LtrData>
          </div>
        </div>
        <StatusBadge tone={lifecycle.tone} label={lifecycle.label} pulse={lifecycle.pulse} />
      </div>

      <div className="plan-stage-list" aria-label="بخش‌های برنامه">
        <div className="tabs" role="navigation" aria-label="بخش‌های برنامه">
          {(['intake', 'review', 'planning', 'execution'] as A01StageKey[]).map((stage) => {
            const label = PLAN_SECTION_LABELS[stage];
            const isActive = activeSection === stage;

            if (stage === 'execution' && !executionTabEnabled) {
              return (
                <span
                  key={stage}
                  className={isActive ? 'tab active' : 'tab'}
                  aria-disabled="true"
                  title="در حال حاضر در دسترس نیست"
                  style={{ pointerEvents: 'none' }}
                >
                  {label}
                </span>
              );
            }

            return (
              <NavLink
                key={stage}
                to={`/plans/${plan.id}/${stage}`}
                end
                className={isActive ? 'tab active' : 'tab'}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
