import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { A01PlanViewModel, PlansListView } from '@/features/plans/a01-types';
import { CreatePlanDialog } from '@/features/plans/components/CreatePlanDialog';
import { DeleteDraftDialog, EditPlanDialog } from '@/features/plans/components/PlanMetaDialogs';
import { PlansTable } from '@/features/plans/components/PlansTable';
import {
  PlansAllReadyState,
  PlansEmptyState,
  PlansErrorState,
  PlansLoadingState,
  PlansNoResults,
} from '@/features/plans/components/PlansStates';
import { PlansToolbar } from '@/features/plans/components/PlansToolbar';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { usePlansList } from '@/features/plans/hooks/usePlansData';
import { planStagePath } from '@/features/plans/plan-stage-path';
import { PROGRAMS_PAGE_SIZE, queryGroupedPlans } from '@/features/plans/query-plans';
import { toServiceDateSortKey } from '@/features/plans/plan-name';
import '@/features/plans/styles/plans.css';

export function PlansPage() {
  const navigate = useNavigate();
  const port = usePlansDataPort();
  const { state, reload } = usePlansList();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<PlansListView>('preparing');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<A01PlanViewModel | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<A01PlanViewModel | null>(null);

  const plans = useMemo(() => (state.status === 'ready' ? state.plans : []), [state]);
  const referenceDate = port.getReferenceDate();

  const queried = useMemo(
    () =>
      queryGroupedPlans(
        plans,
        { search, view, page, pageSize: PROGRAMS_PAGE_SIZE },
        referenceDate,
      ),
    [plans, search, view, page, referenceDate],
  );

  useEffect(() => {
    setPage(1);
  }, [search, view]);

  const openPlan = (plan: A01PlanViewModel) => {
    navigate(planStagePath(plan.id, plan.suggestedSection));
  };

  const preparingEmpty = state.status === 'ready' && plans.length > 0 && queried.preparingCount === 0;
  const noResults =
    state.status === 'ready' &&
    plans.length > 0 &&
    !(view === 'preparing' && preparingEmpty) &&
    queried.total === 0;

  return (
    <div className="plan-workspace-page">
      <h1 className="sr-only">برنامه‌ها</h1>
      <PlansToolbar
        search={search}
        onSearch={setSearch}
        view={view}
        onView={setView}
        onCreatePlan={() => setCreateOpen(true)}
        preparingCount={queried.preparingCount}
        allCount={queried.allCount}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {state.status === 'loading' ? <PlansLoadingState /> : null}
        {state.status === 'error' ? <PlansErrorState onRetry={() => void reload()} /> : null}
        {state.status === 'ready' && plans.length === 0 ? (
          <PlansEmptyState onCreatePlan={() => setCreateOpen(true)} />
        ) : null}
        {state.status === 'ready' && view === 'preparing' && preparingEmpty ? (
          <PlansAllReadyState onViewAll={() => setView('all')} />
        ) : null}
        {noResults ? (
          <PlansNoResults
            search={search}
            onClear={() => {
              setSearch('');
              setView('all');
            }}
          />
        ) : null}
        {state.status === 'ready' && queried.items.length > 0 ? (
          <PlansTable
            sections={queried.pageSections}
            view={view}
            onOpenPlan={openPlan}
            onEditMeta={setEditingPlan}
            onDeleteDraft={setDeletingPlan}
            page={queried.page}
            pageCount={queried.pageCount}
            startItem={queried.startItem}
            endItem={queried.endItem}
            totalItems={queried.total}
            onPage={setPage}
          />
        ) : null}
      </div>

      {createOpen ? (
        <CreatePlanDialog
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (values) => {
            const created = await port.createPlan({
              ...values,
              deliveryDate: values.deliveryDate,
            });
            setCreateOpen(false);
            navigate(`/plans/${created.id}/intake`);
          }}
        />
      ) : null}

      {editingPlan ? (
        <EditPlanDialog
          plan={editingPlan}
          onCancel={() => setEditingPlan(null)}
          onSave={async (updates) => {
            await port.updatePlan(editingPlan.id, {
              ...updates,
              serviceDateSortKey: toServiceDateSortKey(updates.deliveryDate),
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
