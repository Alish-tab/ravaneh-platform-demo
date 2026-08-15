import { useEffect } from 'react';

import { GenerationPanel } from '@/features/planning/components/GenerationPanel';
import { PlanningCollapsedPanel, PlanningSidePanel } from '@/features/planning/components/PlanningSidePanel';
import { TRANSFER_UNASSIGNED } from '@/features/planning/components/AreaTransferPicker';
import { PlanningMap } from '@/features/planning/components/PlanningMap';
import { PlanningSummaryBar } from '@/features/planning/components/PlanningSummaryBar';
import { findStopInPlan, PLANNING_PLAN_FIXTURE } from '@/features/planning/fixture/planning-fixture';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import type {
  PlanningGenerationPhase,
  PlanningGenerationTiming,
} from '@/features/planning/generation';
import { usePlanningFixture } from '@/features/planning/hooks/usePlanningFixture';
import { usePlanningGeneration } from '@/features/planning/hooks/usePlanningGeneration';
import { usePlanningSelection } from '@/features/planning/hooks/usePlanningSelection';
import { useRouteAreas } from '@/features/planning/hooks/useRouteAreas';

type PlanningWorkspaceProps = {
  /** Optional override for tests; defaults to the Planning demo fixture. */
  initialFixture?: PlanningPlanFixture;
  /** Production default is pre-generation (`ready`). Tests may start in `generated`. */
  initialGenerationPhase?: PlanningGenerationPhase;
  simulateGenerationFail?: boolean;
  generationTiming?: PlanningGenerationTiming;
};

export function PlanningWorkspace({
  initialFixture = PLANNING_PLAN_FIXTURE,
  initialGenerationPhase = 'ready',
  simulateGenerationFail = false,
  generationTiming,
}: PlanningWorkspaceProps) {
  const {
    fixture,
    isPending,
    assignStopToRoute,
    moveStopToRoute,
    removeStopFromRoute,
    moveOrderToRoute,
    updateStopLocation,
    assignDriverToRoute,
    removeDriverFromRoute,
    setDriverAssignmentLocked,
  } = usePlanningFixture(initialFixture);
  const generation = usePlanningGeneration({
    initialPhase: initialGenerationPhase,
    initialTargetAreaCount: Math.max(initialFixture.routes.length, 1),
    simulateFail: simulateGenerationFail,
    timing: generationTiming,
  });
  const planning = usePlanningSelection(fixture);
  const areas = useRouteAreas(fixture);
  const activeRouteColor =
    fixture.routes.find((route) => route.routeId === planning.activeRouteId)?.color ?? undefined;

  useEffect(() => {
    if (!planning.correctionStopId) return;
    const found = findStopInPlan(fixture, planning.correctionStopId);
    if (!found?.route) planning.cancelLocationCorrection();
  }, [fixture, planning.correctionStopId, planning.cancelLocationCorrection]);

  const handleConfirmAreaAssign = async (routeId: string) => {
    const stopId = planning.areaPickerStopId;
    if (!stopId) return;
    const ok = await assignStopToRoute(stopId, routeId, planning.excludedOrderIds);
    if (ok) {
      planning.applyAfterAssign(stopId, routeId);
    }
  };

  const handleConfirmAreaTransfer = async (destinationId: string) => {
    const flow = planning.transferFlow;
    if (!flow?.scope) return;

    if (flow.scope === 'order' && flow.orderId) {
      if (destinationId === TRANSFER_UNASSIGNED) return;
      const result = await moveOrderToRoute(flow.orderId, destinationId);
      if (result.ok && result.destinationStopId) {
        planning.applyAfterOrderTransfer(flow.orderId, destinationId, result.destinationStopId);
      }
      return;
    }

    const stopId = flow.stopId;
    if (destinationId === TRANSFER_UNASSIGNED) {
      const ok = await removeStopFromRoute(stopId);
      if (ok) planning.applyAfterUnassign(stopId);
      return;
    }

    const ok = await moveStopToRoute(stopId, destinationId);
    if (ok) planning.applyAfterRouteTransfer(stopId, destinationId);
  };

  const handleConfirmDriverAssign = async () => {
    const routeId = planning.driverPickerRouteId;
    const driver = planning.pendingDriver;
    if (!routeId || !driver) return;
    const ok = await assignDriverToRoute(routeId, driver);
    if (ok) planning.applyAfterDriverAssign(routeId);
  };

  const handleConfirmRemoveDriver = async () => {
    const routeId = planning.removeDriverRouteId;
    if (!routeId) return;
    const ok = await removeDriverFromRoute(routeId);
    if (ok) planning.applyAfterDriverRemove(routeId);
  };

  const handleToggleDriverLock = (routeId: string) => {
    const route = fixture.routes.find((item) => item.routeId === routeId);
    if (!route?.driverId) return;
    setDriverAssignmentLocked(routeId, !route.driverAssignmentLocked);
  };

  const handleSaveLocationCorrection = async () => {
    const stopId = planning.correctionStopId;
    const proposed = planning.proposedLocation;
    if (!stopId || !proposed) return;
    const ok = await updateStopLocation(stopId, proposed);
    if (ok) planning.applyAfterLocationCorrection(stopId);
  };

  return (
    <div className="planning-body" data-testid="planning-body" data-generation-phase={generation.phase}>
      <PlanningSummaryBar
        fixture={fixture}
        excludedOrderIds={planning.excludedOrderIds}
        phase={generation.phase}
        targetAreaCount={generation.targetAreaCount}
        onTargetAreaCountChange={generation.setTargetAreaCount}
        onStartGeneration={generation.startGeneration}
      />
      <div className="planning-workspace">
        <div className="planning-map-pane" data-testid="planning-map-pane">
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
            selectionMode={planning.selectionMode}
            activeRouteColor={activeRouteColor}
          />
        ) : generation.areasGenerated ? (
          <PlanningSidePanel
            fixture={fixture}
            selectedRouteId={planning.selection.selectedRouteId}
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
            onConfirmAreaAssign={(routeId) => {
              void handleConfirmAreaAssign(routeId);
            }}
            onExcludeUnassignedStop={planning.excludeUnassignedStopOrders}
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
    </div>
  );
}
