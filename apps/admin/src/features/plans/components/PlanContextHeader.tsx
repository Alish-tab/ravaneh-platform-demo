import { NavLink, useMatch } from 'react-router-dom';

import { LtrData, StatusBadge, type StatusTone } from '@/shared/ui';

import type {
  A01PlanViewModel,
  A01PresentationStatus,
  A01StageKey,
} from '@/features/plans/a01-types';

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
  return (
    stage === 'intake' ||
    stage === 'review' ||
    stage === 'planning' ||
    stage === 'execution'
  );
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
      return {
        tone: 'neutral',
        label: 'پیش‌نویس',
      };

    case 'ready':
      return {
        tone: 'success',
        label: 'آماده انتشار',
      };

    case 'planning_active':
      return {
        tone: 'accent',
        label: 'منتشرشده / آماده اجرا',
        pulse: true,
      };

    case 'active':
      return {
        tone: 'accent',
        label: 'در حال اجرا',
        pulse: true,
      };

    case 'done':
      return {
        tone: 'success',
        label: 'تکمیل‌شده',
      };

    default:
      // uploading / process / review / intake_failed / etc.
      // are legacy workflow/presentation statuses, not canonical lifecycle values.
      return {
        tone: 'neutral',
        label: 'پیش‌نویس',
      };
  }
}

/**
 * Plan workspace section header.
 *
 * Section navigation is persistent workspace navigation, not a linear wizard.
 * The active section is derived from the route and is independent from lifecycle.
 *
 * Breadcrumb back to Plans lives in GlobalTopContext.
 */
export function PlanContextHeader({
  plan,
}: PlanContextHeaderProps) {
  const routeMatch = useMatch('/plans/:planId/:stage');
  const routeStage = routeMatch?.params.stage;

  const activeSection = isStageKey(routeStage)
    ? routeStage
    : null;

  const lifecycle =
    temporaryLifecyclePresentationFromLegacyStatus(
      plan.status,
    );

  return (
    <div className="plan-context-header">
      <div className="plan-context-header-meta">
        <div>
          <div className="text-[12.5px] leading-tight font-semibold text-[var(--text-primary)]">
            {plan.name}
          </div>

          <div className="mt-0.5 flex items-center gap-1.5">
            <LtrData className="text-[10px] text-[var(--text-muted)]">
              {plan.id}
            </LtrData>

            <span className="text-[11px] text-[var(--border-default)]">
              ·
            </span>

            <LtrData className="text-[10px] text-[var(--text-secondary)]">
              {plan.deliveryDate}
            </LtrData>
          </div>
        </div>

        <StatusBadge
          tone={lifecycle.tone}
          label={lifecycle.label}
          pulse={lifecycle.pulse}
        />
      </div>

      <div
        className="plan-stage-list"
        aria-label="بخش‌های برنامه"
      >
        <nav
          className="tabs"
          aria-label="بخش‌های برنامه"
        >
          {(
            [
              'intake',
              'review',
              'planning',
              'execution',
            ] as A01StageKey[]
          ).map((stage) => {
            const label = PLAN_SECTION_LABELS[stage];
            const isActive =
              activeSection === stage;

            return (
              <NavLink
                key={stage}
                to={`/plans/${plan.id}/${stage}`}
                end
                className={
                  isActive
                    ? 'tab active'
                    : 'tab'
                }
                aria-current={
                  isActive
                    ? 'page'
                    : undefined
                }
              >
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}