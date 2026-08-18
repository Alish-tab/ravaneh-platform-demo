import { useParams } from 'react-router-dom';

import { ExecutionWorkspace } from '@/features/execution/components/ExecutionWorkspace';
import { useExecutionData } from '@/features/execution/hooks/useExecutionData';
import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { Button, InlineMessage } from '@/shared/ui';
import '@/features/execution/styles/execution.css';

export function ExecutionPage() {
  const { planId } = useParams<{ planId: string }>();
  const { plan, status: planStatus, reload: reloadPlan } = usePlan(planId);
  const execution = useExecutionData(planId);

  if (planStatus === 'loading') {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="info">در حال بارگذاری برنامه…</InlineMessage>
      </div>
    );
  }

  if (planStatus === 'error') {
    return (
      <div className="plan-workspace-page flex flex-col items-start gap-3 p-6">
        <InlineMessage tone="error">بارگذاری برنامه ناموفق بود.</InlineMessage>
        <Button variant="secondary" size="sm" onClick={() => void reloadPlan()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (planStatus === 'missing' || !plan) {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="error">برنامه یافت نشد.</InlineMessage>
      </div>
    );
  }

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader plan={plan} />
      <ExecutionWorkspace
        snapshot={execution.snapshot}
        status={execution.status}
        errorKind={execution.errorKind}
        isRefreshing={execution.isRefreshing}
        systemNotice={execution.systemNotice}
        onRetry={() => void execution.reload()}
        searchOrder={execution.searchOrder}
        saveFollowupNote={execution.saveFollowupNote}
      />
    </div>
  );
}
