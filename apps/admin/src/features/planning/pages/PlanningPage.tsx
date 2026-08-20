import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PlanningWorkspace } from '@/features/planning/components/PlanningWorkspace';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import { PlansDataContext } from '@/features/plans/fixture/plans-data-context';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { planStagePath } from '@/features/plans/plan-stage-path';
import { Button, InlineMessage } from '@/shared/ui';
import '@/features/planning/styles/planning.css';

/**
 * Plan-scoped planning workspace at `/plans/:planId/planning`.
 */
export function PlanningPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plan, status, reload } = usePlan(planId);
  const port = useContext(PlansDataContext);
  const [fixture, setFixture] = useState<PlanningPlanFixture | null>(null);
  const [fixtureError, setFixtureError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!planId || !port) return;
    setFixtureError(false);
    void port.getPlanningState(planId).then(
      (next) => {
        if (!cancelled) setFixture(next);
      },
      () => {
        if (!cancelled) setFixtureError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [planId, port]);

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

  if (fixtureError) {
    return (
      <div className="plan-workspace-page">
        <PlanContextHeader plan={plan} />
        <div className="flex flex-col items-start gap-3 p-6">
          <InlineMessage tone="error">بارگذاری برنامه‌ریزی ناموفق بود.</InlineMessage>
          <Button variant="secondary" size="sm" onClick={() => void reload()}>
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="plan-workspace-page">
        <PlanContextHeader plan={plan} />
        <div className="p-6">
          <InlineMessage tone="info">در حال بارگذاری برنامه‌ریزی…</InlineMessage>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader plan={plan} />

      <PlanningWorkspace
        key={plan.id}
        planId={plan.id}
        plan={plan}
        initialFixture={fixture}
        initialGenerationPhase={fixture.generationPhase}
        onPublishSuccess={(publishedPlanId) =>
          navigate(planStagePath(publishedPlanId, 'execution'))
        }
      />
    </div>
  );
}
