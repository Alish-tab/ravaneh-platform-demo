import { toPersianDigits } from '@/shared/lib/format';
import { LtrData } from '@/shared/ui';

import type { A01PlanViewModel, A01StageKey } from '@/features/plans/a01-types';
import { PlanStatusBadge } from '@/features/plans/components/PlanBadges';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { A01_PLAN_STAGES } from '@/features/plans/presentation';

type PlanContextHeaderProps = {
  plan: A01PlanViewModel;
  activeStage: A01StageKey;
  onStageChange?: (stage: A01StageKey) => void;
};

/**
 * A01 Plan workspace stage header.
 * Stage strip is workspace navigation — not global app navigation.
 * Breadcrumb back to Plans lives in GlobalTopContext.
 */
export function PlanContextHeader({
  plan,
  activeStage,
  onStageChange,
}: PlanContextHeaderProps) {
  const activeIdx = A01_PLAN_STAGES.findIndex((stage) => stage.key === activeStage);

  return (
    <div className="a01-plan-header">
      <div className="a01-plan-header-meta">
        <div>
          <div className="text-[12.5px] font-semibold leading-tight text-[var(--text-primary)]">
            {plan.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <LtrData className="text-[10px] text-[var(--text-muted)]">{plan.id}</LtrData>
            <span className="text-[11px] text-[var(--border-default)]">·</span>
            <LtrData className="text-[10px] text-[var(--text-secondary)]">{plan.deliveryDate}</LtrData>
          </div>
        </div>
        <PlanStatusBadge status={plan.status} />
      </div>

      <div className="a01-plan-stages" aria-label="مراحل برنامه">
        {A01_PLAN_STAGES.map((stage, idx) => {
          const stateType = idx < activeIdx ? 'done' : idx === activeIdx ? 'current' : 'upcoming';
          return (
            <div key={stage.key} className="flex items-center">
              {idx > 0 ? (
                <div
                  className={['a01-stage-connector', idx <= activeIdx ? 'active' : '']
                    .filter(Boolean)
                    .join(' ')}
                />
              ) : null}
              <button
                type="button"
                className={['a01-stage-step', stateType].filter(Boolean).join(' ')}
                aria-current={stateType === 'current' ? 'step' : undefined}
                onClick={() => onStageChange?.(stage.key)}
              >
                <span className="a01-stage-num">
                  {stateType === 'done' ? (
                    <Icon d={ICONS.check} size={9} />
                  ) : (
                    toPersianDigits(stage.num)
                  )}
                </span>
                <span>{stage.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
