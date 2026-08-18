import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { A01PlanViewModel, A01StageKey } from '@/features/plans/a01-types';
import { CreatePlanDialog } from '@/features/plans/components/CreatePlanDialog';
import { DeleteDraftDialog, EditPlanDialog } from '@/features/plans/components/PlanMetaDialogs';
import { PlansTable } from '@/features/plans/components/PlansTable';
import {
  PlansEmptyState,
  PlansErrorState,
  PlansLoadingState,
  PlansNoResults,
} from '@/features/plans/components/PlansStates';
import { PlansToolbar } from '@/features/plans/components/PlansToolbar';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { usePlansList } from '@/features/plans/hooks/usePlansData';
import { planStagePath } from '@/features/plans/plan-stage-path';
import '@/features/plans/styles/plans.css';

export function PlansPage() {
  const navigate = useNavigate();
  const port = usePlansDataPort();
  const { state, reload } = usePlansList();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<A01StageKey | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<A01PlanViewModel | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<A01PlanViewModel | null>(null);

  const plans = useMemo(() => (state.status === 'ready' ? state.plans : []), [state]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (stageFilter !== 'all' && plan.currentStage !== stageFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        plan.name.includes(search.trim()) ||
        plan.id.toLowerCase().includes(q) ||
        plan.deliveryDate.includes(search.trim())
      );
    });
  }, [plans, search, stageFilter]);

  const openPlan = (plan: A01PlanViewModel) => {
    navigate(planStagePath(plan.id, plan.currentStage));
  };

  return (
    <div className="plan-workspace-page">
      <PlansToolbar
        search={search}
        onSearch={setSearch}
        stageFilter={stageFilter}
        onStageFilter={setStageFilter}
        onCreatePlan={() => setCreateOpen(true)}
        totalCount={plans.length}
        filteredCount={filteredPlans.length}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {state.status === 'loading' ? <PlansLoadingState /> : null}
        {state.status === 'error' ? <PlansErrorState onRetry={() => void reload()} /> : null}
        {state.status === 'ready' && plans.length === 0 ? (
          <PlansEmptyState onCreatePlan={() => setCreateOpen(true)} />
        ) : null}
        {state.status === 'ready' && plans.length > 0 && filteredPlans.length === 0 ? (
          <PlansNoResults
            search={search}
            stageFilter={stageFilter}
            onClear={() => {
              setSearch('');
              setStageFilter('all');
            }}
          />
        ) : null}
        {state.status === 'ready' && filteredPlans.length > 0 ? (
          <PlansTable
            plans={filteredPlans}
            onOpenPlan={openPlan}
            onEditMeta={setEditingPlan}
            onDeleteDraft={setDeletingPlan}
          />
        ) : null}
      </div>

      {createOpen ? (
        <CreatePlanDialog
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (values) => {
            const created = await port.createPlan(values);
            setCreateOpen(false);
            navigate(`/plans/${created.id}/intake`);
          }}
        />
      ) : null}

      {editingPlan ? (
        <EditPlanDialog
          plan={editingPlan}
          isDownstreamLocked={
            editingPlan.currentStage === 'planning' || editingPlan.currentStage === 'execution'
          }
          onCancel={() => setEditingPlan(null)}
          onSave={async (updates) => {
            await port.updatePlan(editingPlan.id, {
              ...updates,
              lastChanged: 'همین الان',
            });
            setEditingPlan(null);
          }}
        />
      ) : null}

      {deletingPlan ? (
        <DeleteDraftDialog
          plan={deletingPlan}
          onCancel={() => setDeletingPlan(null)}
          onConfirm={async () => {
            await port.deletePlan(deletingPlan.id);
            setDeletingPlan(null);
          }}
        />
      ) : null}
    </div>
  );
}
