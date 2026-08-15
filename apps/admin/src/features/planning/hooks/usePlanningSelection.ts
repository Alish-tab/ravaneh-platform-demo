import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  actionableOrderIdsOnStop,
  addExcludedOrderIds,
  isUnassignedStopFullyExcluded,
} from '@/features/planning/fixture/exclude-order';
import { findStopInPlan } from '@/features/planning/fixture/planning-fixture';
import type {
  PlanningAreaFilter,
  PlanningDriver,
  PlanningPlanFixture,
  PlanningSelection,
  PlanningTransferFlow,
  PlanningTransferScope,
} from '@/features/planning/fixture/types';
import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';

export function usePlanningSelection(fixture: PlanningPlanFixture) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedUnassignedStopId, setSelectedUnassignedStopId] = useState<string | null>(null);
  const [areaPickerStopId, setAreaPickerStopId] = useState<string | null>(null);
  const [transferFlow, setTransferFlow] = useState<PlanningTransferFlow | null>(null);
  const [driverPickerRouteId, setDriverPickerRouteId] = useState<string | null>(null);
  const [pendingDriver, setPendingDriver] = useState<PlanningDriver | null>(null);
  const [removeDriverRouteId, setRemoveDriverRouteId] = useState<string | null>(null);
  const [justAssignedRouteId, setJustAssignedRouteId] = useState<string | null>(null);
  const [correctionStopId, setCorrectionStopId] = useState<string | null>(null);
  const [proposedLocation, setProposedLocation] = useState<PlanningLatLng | null>(null);
  const [excludedOrderIds, setExcludedOrderIds] = useState<Set<string>>(() => new Set());
  const [showRouteAreas, setShowRouteAreas] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [areaFilter, setAreaFilter] = useState<PlanningAreaFilter>('all');
  const [routeFitTrigger, setRouteFitTrigger] = useState<string | null>(null);

  const clearTransfer = useCallback(() => {
    setTransferFlow(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRouteId(null);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setSelectedUnassignedStopId(null);
    setAreaPickerStopId(null);
    setTransferFlow(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setCorrectionStopId(null);
    setProposedLocation(null);
  }, []);

  /** Empty-map click: clear selection/inspector only — keep exclusion, areas toggle, drivers. */
  const clearMapSelection = useCallback(() => {
    if (correctionStopId) return;
    setSelectedRouteId(null);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setSelectedUnassignedStopId(null);
    setAreaPickerStopId(null);
  }, [correctionStopId]);

  const toggleShowRouteAreas = useCallback(() => {
    setShowRouteAreas((current) => !current);
  }, []);

  const selectRoute = useCallback((routeId: string) => {
    if (correctionStopId) return;
    setSelectedUnassignedStopId(null);
    setAreaPickerStopId(null);
    setTransferFlow(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setSelectedOrderId(null);
    setSelectedStopId(null);
    setSelectedRouteId((current) => {
      if (current === routeId) return null;
      setRouteFitTrigger(`${routeId}:${Date.now()}`);
      return routeId;
    });
    setPanelCollapsed(false);
  }, [correctionStopId]);

  const selectStop = useCallback(
    (stopId: string) => {
      if (correctionStopId) return;
      const found = findStopInPlan(fixture, stopId);
      if (!found) return;

      if (!found.route) {
        if (isUnassignedStopFullyExcluded(found.stop, excludedOrderIds)) return;
        setSelectedRouteId(null);
        setSelectedStopId(null);
        setSelectedOrderId(null);
        setAreaPickerStopId(null);
        setTransferFlow(null);
        setDriverPickerRouteId(null);
        setPendingDriver(null);
        setRemoveDriverRouteId(null);
        setSelectedUnassignedStopId((current) => (current === stopId ? null : stopId));
        setPanelCollapsed(false);
        return;
      }

      setSelectedUnassignedStopId(null);
      setAreaPickerStopId(null);
      setTransferFlow(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setSelectedOrderId(null);
      setSelectedStopId(stopId);
      setSelectedRouteId(found.route.routeId);
      setPanelCollapsed(false);
    },
    [correctionStopId, excludedOrderIds, fixture],
  );

  const selectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setPanelCollapsed(false);
  }, []);

  const openAreaPicker = useCallback(
    (stopId: string) => {
      const stop = fixture.unassignedStops.find((item) => item.stopId === stopId);
      if (!stop || isUnassignedStopFullyExcluded(stop, excludedOrderIds)) return;
      setSelectedUnassignedStopId(stopId);
      setSelectedRouteId(null);
      setSelectedStopId(null);
      setSelectedOrderId(null);
      setTransferFlow(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setAreaPickerStopId(stopId);
      setPanelCollapsed(false);
    },
    [excludedOrderIds, fixture.unassignedStops],
  );

  const closeAreaPicker = useCallback(() => {
    setAreaPickerStopId(null);
  }, []);

  /**
   * A03 «مستثنا کردن»: exclude every non-excluded order on the unassigned stop.
   * Model remains per-order for dispatch readiness; UI action is stop-scoped.
   */
  const excludeUnassignedStopOrders = useCallback(
    (stopId: string) => {
      const stop = fixture.unassignedStops.find((item) => item.stopId === stopId);
      if (!stop) return;
      const toExclude = actionableOrderIdsOnStop(stop, excludedOrderIds);
      if (toExclude.length === 0) return;
      setExcludedOrderIds((prev) => addExcludedOrderIds(prev, toExclude));
    },
    [excludedOrderIds, fixture.unassignedStops],
  );

  /** Per-order exclusion for model/tests — preserves remaining actionable orders. */
  const excludeOrder = useCallback((orderId: string) => {
    setExcludedOrderIds((prev) => addExcludedOrderIds(prev, [orderId]));
  }, []);

  useEffect(() => {
    const clearIfFullyExcluded = (stopId: string | null) => {
      if (!stopId) return;
      const stop = fixture.unassignedStops.find((item) => item.stopId === stopId);
      if (stop && isUnassignedStopFullyExcluded(stop, excludedOrderIds)) {
        setSelectedUnassignedStopId((current) => (current === stopId ? null : current));
        setAreaPickerStopId((current) => (current === stopId ? null : current));
      }
    };
    clearIfFullyExcluded(selectedUnassignedStopId);
    clearIfFullyExcluded(areaPickerStopId);
  }, [areaPickerStopId, excludedOrderIds, fixture.unassignedStops, selectedUnassignedStopId]);


  /** Stop-level transfer: always whole delivery point → destination picker. */
  const openTransferFromStop = useCallback(
    (stopId: string) => {
      const found = findStopInPlan(fixture, stopId);
      if (!found?.route) return;
      setAreaPickerStopId(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setCorrectionStopId(null);
      setProposedLocation(null);
      setSelectedUnassignedStopId(null);
      setSelectedOrderId(null);
      setSelectedStopId(stopId);
      setSelectedRouteId(found.route.routeId);
      setTransferFlow({ stopId, orderId: null, scope: 'stop', step: 'pick' });
      setPanelCollapsed(false);
    },
    [fixture],
  );

  /** Order-level transfer: scope choice when multi-order, else whole-stop picker. */
  const openTransferFromOrder = useCallback(
    (stopId: string, orderId: string) => {
      const found = findStopInPlan(fixture, stopId);
      if (!found?.route) return;
      setAreaPickerStopId(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setCorrectionStopId(null);
      setProposedLocation(null);
      setSelectedUnassignedStopId(null);
      setSelectedStopId(stopId);
      setSelectedOrderId(orderId);
      setSelectedRouteId(found.route.routeId);
      if (found.stop.tasks.length > 1) {
        setTransferFlow({ stopId, orderId, scope: null, step: 'scope' });
      } else {
        setTransferFlow({ stopId, orderId, scope: 'stop', step: 'pick' });
      }
      setPanelCollapsed(false);
    },
    [fixture],
  );

  const setTransferScope = useCallback((scope: PlanningTransferScope) => {
    setTransferFlow((current) =>
      current ? { ...current, scope, step: 'pick' } : current,
    );
  }, []);

  const backFromTransferPick = useCallback(() => {
    setTransferFlow((current) => {
      if (!current) return null;
      if (current.orderId && current.step === 'pick') {
        const found = findStopInPlan(fixture, current.stopId);
        if (found && found.stop.tasks.length > 1) {
          return { ...current, step: 'scope', scope: null };
        }
      }
      return null;
    });
  }, [fixture]);

  const closeTransferPicker = useCallback(() => {
    setTransferFlow(null);
  }, []);

  const openDriverPicker = useCallback((routeId: string) => {
    setAreaPickerStopId(null);
    setTransferFlow(null);
    setRemoveDriverRouteId(null);
    setPendingDriver(null);
    setSelectedUnassignedStopId(null);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setSelectedRouteId(routeId);
    setDriverPickerRouteId(routeId);
    setPanelCollapsed(false);
  }, []);

  const closeDriverPicker = useCallback(() => {
    setDriverPickerRouteId(null);
    setPendingDriver(null);
  }, []);

  const selectDriverCandidate = useCallback((driver: PlanningDriver) => {
    setPendingDriver(driver);
  }, []);

  const clearDriverCandidate = useCallback(() => {
    setPendingDriver(null);
  }, []);

  const openRemoveDriver = useCallback((routeId: string) => {
    setAreaPickerStopId(null);
    setTransferFlow(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setSelectedUnassignedStopId(null);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setSelectedRouteId(routeId);
    setRemoveDriverRouteId(routeId);
    setPanelCollapsed(false);
  }, []);

  const closeRemoveDriver = useCallback(() => {
    setRemoveDriverRouteId(null);
  }, []);

  const openLocationCorrection = useCallback(
    (stopId: string) => {
      const found = findStopInPlan(fixture, stopId);
      if (!found?.route) return;
      setAreaPickerStopId(null);
      setTransferFlow(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setSelectedUnassignedStopId(null);
      setSelectedStopId(stopId);
      setSelectedRouteId(found.route.routeId);
      setCorrectionStopId(stopId);
      setProposedLocation(null);
      setPanelCollapsed(false);
    },
    [fixture],
  );

  const setCorrectionProposedLocation = useCallback((coords: PlanningLatLng) => {
    setProposedLocation(coords);
  }, []);

  const cancelLocationCorrection = useCallback(() => {
    setCorrectionStopId(null);
    setProposedLocation(null);
  }, []);

  const applyAfterLocationCorrection = useCallback((stopId: string) => {
    setCorrectionStopId(null);
    setProposedLocation(null);
    const found = findStopInPlan(fixture, stopId);
    if (found?.route) {
      setSelectedStopId(stopId);
      setSelectedRouteId(found.route.routeId);
      setSelectedUnassignedStopId(null);
    }
    setPanelCollapsed(false);
  }, [fixture]);

  const applyAfterDriverAssign = useCallback((routeId: string) => {
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setSelectedRouteId(routeId);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setJustAssignedRouteId(routeId);
    setPanelCollapsed(false);
    window.setTimeout(() => {
      setJustAssignedRouteId((current) => (current === routeId ? null : current));
    }, 2200);
  }, []);

  const applyAfterDriverRemove = useCallback((routeId: string) => {
    setRemoveDriverRouteId(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setJustAssignedRouteId(null);
    setSelectedRouteId(routeId);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setPanelCollapsed(false);
  }, []);

  const applyAfterAssign = useCallback((stopId: string, routeId: string) => {
    setAreaPickerStopId(null);
    setTransferFlow(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setSelectedUnassignedStopId(null);
    setSelectedOrderId(null);
    setSelectedRouteId(routeId);
    setSelectedStopId(stopId);
    setPanelCollapsed(false);
  }, []);

  const applyAfterRouteTransfer = useCallback((stopId: string, routeId: string) => {
    setTransferFlow(null);
    setAreaPickerStopId(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setSelectedUnassignedStopId(null);
    setSelectedOrderId(null);
    setSelectedRouteId(routeId);
    setSelectedStopId(stopId);
    setPanelCollapsed(false);
  }, []);

  const applyAfterOrderTransfer = useCallback(
    (orderId: string, routeId: string, destinationStopId: string) => {
      setTransferFlow(null);
      setAreaPickerStopId(null);
      setDriverPickerRouteId(null);
      setPendingDriver(null);
      setRemoveDriverRouteId(null);
      setSelectedUnassignedStopId(null);
      setSelectedRouteId(routeId);
      setSelectedStopId(destinationStopId);
      setSelectedOrderId(orderId);
      setPanelCollapsed(false);
    },
    [],
  );

  const applyAfterUnassign = useCallback((stopId: string) => {
    setTransferFlow(null);
    setAreaPickerStopId(null);
    setDriverPickerRouteId(null);
    setPendingDriver(null);
    setRemoveDriverRouteId(null);
    setSelectedRouteId(null);
    setSelectedStopId(null);
    setSelectedOrderId(null);
    setSelectedUnassignedStopId(stopId);
    setPanelCollapsed(false);
  }, []);

  const backFromOrder = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  const backFromStop = useCallback(() => {
    setSelectedOrderId(null);
    setSelectedStopId(null);
    setTransferFlow(null);
  }, []);

  const backFromRoute = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const selection: PlanningSelection = useMemo(
    () => ({
      selectedRouteId,
      selectedStopId,
      selectedOrderId,
      selectedUnassignedStopId,
    }),
    [selectedOrderId, selectedRouteId, selectedStopId, selectedUnassignedStopId],
  );

  const activeRouteId = useMemo(() => {
    if (selectedRouteId) return selectedRouteId;
    if (selectedStopId) {
      return findStopInPlan(fixture, selectedStopId)?.route?.routeId ?? null;
    }
    return null;
  }, [fixture, selectedRouteId, selectedStopId]);

  const selectedStopCoords = useMemo((): [number, number] | null => {
    if (selectedUnassignedStopId) {
      const stop = fixture.unassignedStops.find((item) => item.stopId === selectedUnassignedStopId);
      return stop ? [stop.lat, stop.lng] : null;
    }
    if (!selectedStopId) return null;
    const found = findStopInPlan(fixture, selectedStopId);
    return found ? [found.stop.lat, found.stop.lng] : null;
  }, [fixture, selectedStopId, selectedUnassignedStopId]);

  const activeRouteStops = useMemo(() => {
    if (!activeRouteId) return null;
    return fixture.routes.find((route) => route.routeId === activeRouteId)?.stops ?? null;
  }, [activeRouteId, fixture.routes]);

  const selectionMode =
    areaPickerStopId ||
    transferFlow ||
    driverPickerRouteId ||
    removeDriverRouteId ||
    correctionStopId
      ? ('stop' as const)
      : selectedOrderId
        ? ('order' as const)
        : selectedStopId || selectedUnassignedStopId
          ? ('stop' as const)
          : selectedRouteId
            ? ('route' as const)
            : ('none' as const);

  return {
    selection,
    activeRouteId,
    activeRouteStops,
    selectedStopCoords,
    selectionMode,
    areaPickerStopId,
    transferFlow,
    /** @deprecated prefer transferFlow — kept for transitional call sites */
    transferStopId: transferFlow?.stopId ?? null,
    driverPickerRouteId,
    pendingDriver,
    removeDriverRouteId,
    justAssignedRouteId,
    correctionStopId,
    proposedLocation,
    excludedOrderIds,
    showRouteAreas,
    panelCollapsed,
    setPanelCollapsed,
    areaFilter,
    setAreaFilter,
    routeFitTrigger,
    selectRoute,
    selectStop,
    selectOrder,
    openAreaPicker,
    closeAreaPicker,
    excludeUnassignedStopOrders,
    excludeOrder,
    toggleShowRouteAreas,
    clearMapSelection,
    openTransferFromStop,
    openTransferFromOrder,
    setTransferScope,
    backFromTransferPick,
    closeTransferPicker,
    clearTransfer,
    openDriverPicker,
    closeDriverPicker,
    selectDriverCandidate,
    clearDriverCandidate,
    openRemoveDriver,
    closeRemoveDriver,
    openLocationCorrection,
    setCorrectionProposedLocation,
    cancelLocationCorrection,
    applyAfterLocationCorrection,
    applyAfterDriverAssign,
    applyAfterDriverRemove,
    applyAfterAssign,
    applyAfterRouteTransfer,
    applyAfterOrderTransfer,
    applyAfterUnassign,
    backFromOrder,
    backFromStop,
    backFromRoute,
    clearSelection,
  };
}
