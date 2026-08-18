import { NavLink, useMatch } from 'react-router-dom';

import { LtrData, StatusBadge } from '@/shared/ui';

import type { A01PlanViewModel, A01StageKey } from '@/features/plans/a01-types';
import { PLAN_LIFECYCLE_PRESENTATION } from '@/features/plans/presentation';

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

/**
 * Plan workspace section header.
 *
 * Section navigation is persistent workspace navigation, not a linear wizard.
 * The active section is derived from the route and is independent from lifecycle.
 */
export function PlanContextHeader({ plan }: PlanContextHeaderProps) {
  const routeMatch = useMatch('/plans/:planId/:stage');
  const routeStage = routeMatch?.params.stage;
  const activeSection = isStageKey(routeStage) ? routeStage : null;
  const lifecycle = PLAN_LIFECYCLE_PRESENTATION[plan.lifecycle];

  return (
    <div className="plan-context-header">
      <div className="plan-context-header-meta">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-[12.5px] leading-tight font-semibold text-[var(--text-primary)]">
              {plan.name}
            </div>
            {plan.hasWorkingVersion ? (
              <span className="plans-working-chip">نسخه کاری</span>
            ) : null}
          </div>

          <div className="mt-0.5 flex items-center gap-1.5">
            <LtrData className="text-[10px] text-[var(--text-muted)]">{plan.id}</LtrData>
            <span className="text-[11px] text-[var(--border-default)]">·</span>
            <LtrData className="text-[10px] text-[var(--text-secondary)]">
              {plan.deliveryDate}
            </LtrData>
            {plan.window ? (
              <>
                <span className="text-[11px] text-[var(--border-default)]">·</span>
                <span className="text-[10px] text-[var(--text-secondary)]">{plan.window}</span>
              </>
            ) : null}
          </div>
        </div>

        <StatusBadge tone={lifecycle.tone} label={lifecycle.label} pulse={lifecycle.pulse} />
      </div>

      <div className="plan-stage-list" aria-label="بخش‌های برنامه">
        <nav className="tabs" aria-label="بخش‌های برنامه">
          {(['intake', 'review', 'planning', 'execution'] as A01StageKey[]).map((stage) => {
            const isActive = activeSection === stage;
            return (
              <NavLink
                key={stage}
                to={`/plans/${plan.id}/${stage}`}
                end
                className={isActive ? 'tab active' : 'tab'}
                aria-current={isActive ? 'page' : undefined}
              >
                {PLAN_SECTION_LABELS[stage]}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
