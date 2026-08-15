import { useNavigate, useParams } from 'react-router-dom';

import { PlanningWorkspace } from '@/features/planning/components/PlanningWorkspace';
import { getPlanningFixture } from '@/features/planning/fixture/planning-fixture';
import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { Button, InlineMessage } from '@/shared/ui';
import '@/features/planning/styles/planning.css';

/**
 * Planning workspace — fourth plan-scoped workflow stage at `/plans/:planId/planning`.
 */
export function PlanningPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plan, status, reload } = usePlan(planId);

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

  const fixture = getPlanningFixture(plan.id, { planName: plan.name });

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader
        plan={plan}
        activeStage="planning"
        onStageChange={(stage) => {
          if (stage === 'intake') navigate(`/plans/${plan.id}/intake`);
          if (stage === 'review') navigate(`/plans/${plan.id}/review`);
        }}
      />
      <PlanningWorkspace key={plan.id} initialFixture={fixture} />
    </div>
  );
}
