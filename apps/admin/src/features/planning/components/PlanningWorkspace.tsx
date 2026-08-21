import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DispatchPrepPanel } from '@/features/planning/components/DispatchPrepPanel';
import { GenerationPanel } from '@/features/planning/components/GenerationPanel';
import { PlanningCollapsedPanel, PlanningSidePanel } from '@/features/planning/components/PlanningSidePanel';
import { TRANSFER_UNASSIGNED } from '@/features/planning/components/AreaTransferPicker';
import { PlanningMap } from '@/features/planning/components/PlanningMap';
import { PlanningSummaryBar } from '@/features/planning/components/PlanningSummaryBar';
import { findStopInPlan, PLANNING_PLAN_FIXTURE } from '@/features/planning/fixture/planning-fixture';
import { planningReadiness } from '@/features/planning/fixture/planning-store';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import type {
  PlanningGenerationPhase,
  PlanningGenerationTiming,
} from '@/features/planning/generation';
import { usePlanningFixture } from '@/features/planning/hooks/usePlanningFixture';
import { usePlanningGeneration } from '@/features/planning/hooks/usePlanningGeneration';
import { usePlanningSelection } from '@/features/planning/hooks/usePlanningSelection';
import { useRouteAreas } from '@/features/planning/hooks/useRouteAreas';
import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { PlansDataContext } from '@/features/plans/fixture/plans-data-context';
import { Button, InlineMessage } from '@/shared/ui';

type PlanningWorkspaceProps = {
  planId?: string;
  plan?: A01PlanViewModel | null;
  /** Optional override for tests; defaults to the Planning demo fixture. */
  initialFixture?: PlanningPlanFixture;
  /** Production default is pre-generation (`ready`). Tests may start in `generated`. */
  initialGenerationPhase?: PlanningGenerationPhase;
  simulateGenerationFail?: boolean;
  generationTiming?: PlanningGenerationTiming;
  onPublishSuccess?: (planId: string) => void;
};

export function PlanningWorkspace({
  planId,
  plan,
  initialFixture = PLANNING_PLAN_FIXTURE,
  initialGenerationPhase = 'ready',
  simulateGenerationFail = false,
  generationTiming,
  onPublishSuccess,
}: PlanningWorkspaceProps) {
  const port = useContext(PlansDataContext);
  const {
    fixture,
    replaceFixture,
    isPending,
    assignStopToRoute: assignStopLocally,
    moveStopToRoute: moveStopLocally,
    removeStopFromRoute: removeStopLocally,
    moveOrderToRoute: moveOrderLocally,
    updateStopLocation: updateLocationLocally,
    assignDriverToRoute: assignDriverLocally,
    removeDriverFromRoute: removeDriverLocally,
    setDriverAssignmentLocked: setDriverLockLocally,
  } = usePlanningFixture(initialFixture);

  const runGenerate = useCallback(
    async (targetCount: number): Promise<'generated' | 'failed'> => {
      if (!planId || !port) {
        return simulateGenerationFail ? 'failed' : 'generated';
      }
      try {
        const next = await port.generatePlanningAreas(planId, targetCount);
        replaceFixture(next);
        return next.generationPhase === 'failed' ? 'failed' : 'generated';
      } catch {
        return 'failed';
      }
    },
    [planId, port, replaceFixture, simulateGenerationFail],
  );

  const generation = usePlanningGeneration({
    initialPhase: initialGenerationPhase,
    initialTargetAreaCount: Math.max(
      initialFixture.targetAreaCount,
      initialFixture.areas.length,
      1,
    ),
    simulateFail: simulateGenerationFail,
    timing: generationTiming,
    runGenerate: planId && port ? runGenerate : undefined,
  });
  const planning = usePlanningSelection(fixture);
  const areas = useRouteAreas(fixture);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [rebuildBusy, setRebuildBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const executionLocked =
    plan?.a01Mode === 'execution-locked' || plan?.lifecycle === 'inProgress';
  const readOnly =
    plan?.a01Mode === 'published-readonly' || plan?.a01Mode === 'completed-readonly';
  const unpublished = planId && port ? port.hasUnpublishedPlanningChanges(planId) : false;
  const hasPublished = Boolean(plan?.publishedSnapshot) || Boolean(planId && port?.getPublishedPlanningState(planId));

  const currentWorking = useMemo<PlanningPlanFixture>(
    () => ({ ...fixture, excludedOrderIds: [...planning.excludedOrderIds] }),
    [fixture, planning.excludedOrderIds],
  );
  const readiness = useMemo(
    () =>
      planningReadiness(currentWorking, {
        mutationInProgress: isPending || rebuildBusy || publishBusy,
      }),
    [currentWorking, isPending, publishBusy, rebuildBusy],
  );

  const dirtyRouteCount = fixture.routes.filter((route) => route.dirty).length;

  useEffect(() => {
    if (!planning.correctionStopId) return;
    const found = findStopInPlan(fixture, planning.correctionStopId);
    if (!found?.area) planning.cancelLocationCorrection();
  }, [fixture, planning.correctionStopId, planning.cancelLocationCorrection]);

  const handleConfirmAreaAssign = async (areaId: string) => {
    const stopId = planning.areaPickerStopId;
    if (!stopId) return;
    const next = planId && port
      ? await port.assignPlanningStop(planId, stopId, areaId)
      : null;
    if (next) replaceFixture(next);
    const ok = next ? true : await assignStopLocally(stopId, areaId, planning.excludedOrderIds);
    if (ok) planning.applyAfterAssign(stopId, areaId);
  };

  const handleConfirmAreaTransfer = async (destinationId: string) => {
    const flow = planning.transferFlow;
    if (!flow?.scope) return;

    if (flow.scope === 'order' && flow.orderId) {
      if (destinationId === TRANSFER_UNASSIGNED) return;
      const persisted = planId && port
        ? await port.transferPlanningOrder(planId, flow.orderId, destinationId)
        : null;
      if (persisted) replaceFixture(persisted.fixture);
      const result = persisted
        ? { ok: true, destinationStopId: persisted.destinationStopId }
        : await moveOrderLocally(flow.orderId, destinationId);
      if (result.ok && result.destinationStopId) {
        planning.applyAfterOrderTransfer(flow.orderId, destinationId, result.destinationStopId);
      }
      return;
    }

    const stopId = flow.stopId;
    if (destinationId === TRANSFER_UNASSIGNED) {
      const next = planId && port ? await port.unassignPlanningStop(planId, stopId) : null;
      if (next) replaceFixture(next);
      const ok = next ? true : await removeStopLocally(stopId);
      if (ok) planning.applyAfterUnassign(stopId);
      return;
    }

    const next = planId && port ? await port.transferPlanningStop(planId, stopId, destinationId) : null;
    if (next) replaceFixture(next);
    const ok = next ? true : await moveStopLocally(stopId, destinationId);
    if (ok) planning.applyAfterRouteTransfer(stopId, destinationId);
  };

  const handleConfirmDriverAssign = async () => {
    const areaId = planning.driverPickerRouteId;
    const driver = planning.pendingDriver;
    if (!areaId || !driver) return;
    const next = planId && port ? await port.assignPlanningDriver(planId, areaId, driver) : null;
    if (next) replaceFixture(next);
    const ok = next ? true : await assignDriverLocally(areaId, driver);
    if (ok) planning.applyAfterDriverAssign(areaId);
  };

  const handleConfirmRemoveDriver = async () => {
    const areaId = planning.removeDriverRouteId;
    if (!areaId) return;
    const next = planId && port ? await port.removePlanningDriver(planId, areaId) : null;
    if (next) replaceFixture(next);
    const ok = next ? true : await removeDriverLocally(areaId);
    if (ok) planning.applyAfterDriverRemove(areaId);
  };

  const handleToggleDriverLock = async (areaId: string) => {
    const area = fixture.areas.find((item) => item.areaId === areaId);
    if (!area?.driverId) return;
    if (planId && port) {
      const next = await port.lockPlanningDriver(planId, areaId, !area.driverAssignmentLocked);
      replaceFixture(next);
      return;
    }
    setDriverLockLocally(areaId, !area.driverAssignmentLocked);
  };

  const handleSaveLocationCorrection = async () => {
    const stopId = planning.correctionStopId;
    const proposed = planning.proposedLocation;
    if (!stopId || !proposed) return;
    const next = planId && port
      ? await port.updatePlanningStopLocation(planId, stopId, proposed)
      : null;
    if (next) replaceFixture(next);
    const ok = next ? true : await updateLocationLocally(stopId, proposed);
    if (ok) planning.applyAfterLocationCorrection(stopId);
  };

  const handleRecalc = async () => {
    if (!planId || !port || recalcBusy) return;
    setRecalcBusy(true);
    setActionError(null);
    try {
      const next = await port.recalculatePlanningRoutes(planId, currentWorking);
      replaceFixture(next);
    } catch {
      setActionError('محاسبه مجدد مسیر ناموفق بود.');
    } finally {
      setRecalcBusy(false);
    }
  };

  const handleRebuild = async () => {
    if (!planId || !port || executionLocked) return;
    setRebuildBusy(true);
    setActionError(null);
    try {
      const next = await port.rebuildPlanningAreas(planId, generation.targetAreaCount);
      replaceFixture(next);
      generation.setPhase('generated');
      setRebuildOpen(false);
    } catch {
      setActionError('بازسازی محدوده‌ها ناموفق بود.');
    } finally {
      setRebuildBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!planId || !port || !readiness.canPublish) return;
    setPublishBusy(true);
    setActionError(null);
    try {
      await port.publishPlanning(planId, currentWorking);
    } catch {
      setActionError('انتشار ناموفق بود.');
      setPublishBusy(false);
      return;
    }
    setPublishBusy(false);
    setPublishOpen(false);
    onPublishSuccess?.(planId);
  };

  return (
    <div className="planning-body" data-testid="planning-body" data-generation-phase={generation.phase}>
      {readOnly ? (
        <InlineMessage tone="info">نسخه منتشرشده فقط خواندنی است.</InlineMessage>
      ) : null}
      {executionLocked ? (
        <div className="planning-banner" data-testid="execution-lock-banner">
          اجرا فعال است — بازسازی ساختاری محدوده‌ها غیرفعال است.
        </div>
      ) : null}
      {hasPublished && unpublished ? (
        <div className="planning-banner planning-banner--warn" data-testid="working-dirty-banner">
          نسخه کاری با نسخه منتشرشده برای رانندگان متفاوت است.
        </div>
      ) : null}
      {dirtyRouteCount > 0 ? (
        <div className="planning-banner planning-banner--warn" data-testid="dirty-route-banner">
          {dirtyRouteCount} مسیر نیازمند محاسبه مجدد است.
          {planId && port ? (
            <Button
              variant="secondary"
              size="sm"
              loading={recalcBusy}
              data-testid="recalculate-routes"
              onClick={() => void handleRecalc()}
            >
              محاسبه مجدد مسیرها
            </Button>
          ) : null}
        </div>
      ) : null}
      {actionError ? (
        <InlineMessage tone="error">{actionError}</InlineMessage>
      ) : null}

      <PlanningSummaryBar
        fixture={fixture}
        excludedOrderIds={planning.excludedOrderIds}
        phase={generation.phase}
        targetAreaCount={generation.targetAreaCount}
        onTargetAreaCountChange={generation.setTargetAreaCount}
        onStartGeneration={generation.startGeneration}
        generatedActions={
          generation.areasGenerated ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                data-testid="open-dispatch-prep"
                onClick={() => setDispatchOpen(true)}
              >
                تفکیک پاکت‌ها
              </Button>
              <Button
                variant="secondary"
                size="sm"
                data-testid="open-rebuild-areas"
                disabled={executionLocked || readOnly}
                onClick={() => setRebuildOpen(true)}
              >
                بازسازی محدوده‌ها
              </Button>
              <Button
                variant="primary"
                size="sm"
                data-testid="open-publish-plan"
                disabled={readOnly}
                onClick={() => setPublishOpen(true)}
              >
                {hasPublished ? 'انتشار تغییرات' : 'انتشار برای رانندگان'}
              </Button>
            </>
          ) : null
        }
      />
      <div className="planning-workspace">
        <div className="shared-map-pane" data-testid="planning-map-pane">
          <PlanningMap
            fixture={fixture}
            areas={areas}
            areasGenerated={generation.areasGenerated}
            activeRouteId={planning.activeRouteId}
            selectedStopId={planning.selection.selectedStopId}
            selectedUnassignedStopId={planning.selection.selectedUnassignedStopId}
            selectedStopCoords={planning.selectedStopCoords}
            activeRouteStops={planning.activeRouteStops}
            routeFitTrigger={planning.routeFitTrigger}
            panelCollapsed={planning.panelCollapsed}
            correctionStopId={planning.correctionStopId}
            proposedLocation={planning.proposedLocation}
            showRouteAreas={planning.showRouteAreas}
            onSelectStop={planning.selectStop}
            onSelectRoute={planning.selectRoute}
            onClearMapSelection={planning.clearMapSelection}
            onToggleRouteAreas={planning.toggleShowRouteAreas}
            onCorrectionMapClick={planning.setCorrectionProposedLocation}
          />
        </div>

        {planning.panelCollapsed ? (
          <PlanningCollapsedPanel
            onExpand={() => planning.setPanelCollapsed(false)}
          />
        ) : dispatchOpen ? (
          <DispatchPrepPanel
            fixture={fixture}
            excludedOrderIds={planning.excludedOrderIds}
            onHighlight={(orderId, stopId, areaId) => {
              if (stopId) planning.selectStop(stopId);
              if (orderId) planning.selectOrder(orderId);
              if (areaId) planning.selectRoute(areaId);
            }}
            onExit={() => setDispatchOpen(false)}
          />
        ) : generation.areasGenerated ? (
          <PlanningSidePanel
            fixture={fixture}
            selectedRouteId={planning.selection.selectedRouteId ?? null}
            selectedStopId={planning.selection.selectedStopId}
            selectedOrderId={planning.selection.selectedOrderId}
            selectedUnassignedStopId={planning.selection.selectedUnassignedStopId}
            areaPickerStopId={planning.areaPickerStopId}
            transferFlow={planning.transferFlow}
            driverPickerRouteId={planning.driverPickerRouteId}
            pendingDriver={planning.pendingDriver}
            removeDriverRouteId={planning.removeDriverRouteId}
            justAssignedRouteId={planning.justAssignedRouteId}
            correctionStopId={planning.correctionStopId}
            proposedLocation={planning.proposedLocation}
            excludedOrderIds={planning.excludedOrderIds}
            areaFilter={planning.areaFilter}
            isPending={isPending}
            onAreaFilterChange={planning.setAreaFilter}
            onSelectRoute={planning.selectRoute}
            onSelectStop={planning.selectStop}
            onSelectOrder={planning.selectOrder}
            onOpenAreaPicker={planning.openAreaPicker}
            onCloseAreaPicker={planning.closeAreaPicker}
            onConfirmAreaAssign={(areaId) => {
              void handleConfirmAreaAssign(areaId);
            }}
            onExcludeUnassignedStop={(stopId) => {
              const next = planning.excludeUnassignedStopOrders(stopId);
              if (next && planId && port) {
                void port.setPlanningExcludedOrders(planId, [...next]).then(replaceFixture);
              }
            }}
            onOpenTransferFromStop={planning.openTransferFromStop}
            onOpenTransferFromOrder={planning.openTransferFromOrder}
            onSetTransferScope={planning.setTransferScope}
            onBackFromTransferPick={planning.backFromTransferPick}
            onCloseTransferPicker={planning.closeTransferPicker}
            onConfirmAreaTransfer={(destinationId) => {
              void handleConfirmAreaTransfer(destinationId);
            }}
            onOpenDriverPicker={planning.openDriverPicker}
            onCloseDriverPicker={planning.closeDriverPicker}
            onSelectDriverCandidate={planning.selectDriverCandidate}
            onClearDriverCandidate={planning.clearDriverCandidate}
            onConfirmDriverAssign={() => {
              void handleConfirmDriverAssign();
            }}
            onOpenRemoveDriver={planning.openRemoveDriver}
            onCloseRemoveDriver={planning.closeRemoveDriver}
            onConfirmRemoveDriver={() => {
              void handleConfirmRemoveDriver();
            }}
            onToggleDriverLock={handleToggleDriverLock}
            onOpenLocationCorrection={planning.openLocationCorrection}
            onSaveLocationCorrection={() => {
              void handleSaveLocationCorrection();
            }}
            onCancelLocationCorrection={planning.cancelLocationCorrection}
            onBackFromOrder={planning.backFromOrder}
            onBackFromStop={planning.backFromStop}
            onBackFromRoute={planning.backFromRoute}
            onCollapse={() => planning.setPanelCollapsed(true)}
          />
        ) : (
          <GenerationPanel
            phase={generation.phase}
            targetAreaCount={generation.targetAreaCount}
            onStartGeneration={generation.startGeneration}
            onCollapse={() => planning.setPanelCollapsed(true)}
          />
        )}
      </div>

      {rebuildOpen ? (
        <div className="planning-modal" data-testid="rebuild-confirm">
          <div className="planning-modal-card">
            <div className="mb-2 text-[13px] font-bold">بازسازی محدوده‌ها</div>
            <p className="mb-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              این کار گروه‌بندی محدوده‌ها را از نو می‌سازد. تخصیص‌های قفل‌شده حفظ می‌شوند.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRebuildOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={rebuildBusy}
                data-testid="confirm-rebuild-areas"
                onClick={() => void handleRebuild()}
              >
                تایید بازسازی
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {publishOpen ? (
        <div className="planning-modal" data-testid="publish-confirm">
          <div className="planning-modal-card">
            <div className="mb-2 text-[13px] font-bold">
              {hasPublished ? 'انتشار تغییرات' : 'انتشار برای رانندگان'}
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              راننده‌ها نسخه جدید برنامه {plan?.name ?? fixture.planName} را دریافت می‌کنند.
            </p>
            {!readiness.canPublish ? (
              <ul className="mb-3 text-[12px] text-[var(--warning-text)]" data-testid="publish-blockers">
                {readiness.blockers.map((blocker) => (
                  <li key={blocker.code}>{blocker.message}</li>
                ))}
              </ul>
            ) : (
              <div className="mb-3 text-[12px] text-[var(--success-text)]" data-testid="publish-ready">
                آماده انتشار
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" data-testid="publish-cancel" onClick={() => setPublishOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={publishBusy}
                disabled={!readiness.canPublish}
                data-testid="confirm-publish-plan"
                onClick={() => void handlePublish()}
              >
                تایید انتشار
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
