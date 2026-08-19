import { useCallback, useEffect, useRef, useState } from 'react';

import { assignStopToRoute as applyAssignStopToRoute } from '@/features/planning/fixture/assign-stop';
import {
  assignDriverToRoute as applyAssignDriverToRoute,
  removeDriverFromRoute as applyRemoveDriverFromRoute,
  setDriverAssignmentLocked as applySetDriverAssignmentLocked,
} from '@/features/planning/fixture/assign-driver';
import {
  moveOrderToRoute as applyMoveOrderToRoute,
  moveStopToRoute as applyMoveStopToRoute,
  removeStopFromRoute as applyRemoveStopFromRoute,
} from '@/features/planning/fixture/transfer-stop';
import {
  updateStopLocation as applyUpdateStopLocation,
  type PlanningLatLng,
} from '@/features/planning/fixture/update-stop-location';
import type { PlanningDriver, PlanningPlanFixture } from '@/features/planning/fixture/types';

/**
 * Feature-local mutable Planning fixture.
 * Replace with backend/query when assignment API exists.
 */
export function usePlanningFixture(initial: PlanningPlanFixture) {
  const [fixture, setFixture] = useState(() => structuredClone(initial));
  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false);
  const fixtureRef = useRef(fixture);

  useEffect(() => {
    fixtureRef.current = fixture;
  }, [fixture]);

  const runMutation = useCallback(
    async (
      apply: (current: PlanningPlanFixture) => PlanningPlanFixture | null,
    ): Promise<boolean> => {
      if (pendingRef.current) return false;
      pendingRef.current = true;
      setIsPending(true);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 400);
      });

      const next = apply(fixtureRef.current);
      if (next) {
        fixtureRef.current = next;
        setFixture(next);
      }

      pendingRef.current = false;
      setIsPending(false);
      return next !== null;
    },
    [],
  );

  const assignStopToRoute = useCallback(
    (unassignedStopId: string, routeId: string, excludedOrderIds?: ReadonlySet<string>) =>
      runMutation((current) =>
        applyAssignStopToRoute(current, unassignedStopId, routeId, excludedOrderIds),
      ),
    [runMutation],
  );

  const moveStopToRoute = useCallback(
    (stopId: string, toRouteId: string) =>
      runMutation((current) => applyMoveStopToRoute(current, stopId, toRouteId)),
    [runMutation],
  );

  const removeStopFromRoute = useCallback(
    (stopId: string) => runMutation((current) => applyRemoveStopFromRoute(current, stopId)),
    [runMutation],
  );

  const moveOrderToRoute = useCallback(
    async (
      orderId: string,
      toRouteId: string,
    ): Promise<{ ok: boolean; destinationStopId: string | null }> => {
      if (pendingRef.current) return { ok: false, destinationStopId: null };
      pendingRef.current = true;
      setIsPending(true);

      await new Promise((resolve) => {
        window.setTimeout(resolve, 400);
      });

      const result = applyMoveOrderToRoute(fixtureRef.current, orderId, toRouteId);
      if (result) {
        fixtureRef.current = result.fixture;
        setFixture(result.fixture);
      }

      pendingRef.current = false;
      setIsPending(false);
      return {
        ok: result !== null,
        destinationStopId: result?.destinationStopId ?? null,
      };
    },
    [],
  );

  const updateStopLocation = useCallback(
    (stopId: string, coords: PlanningLatLng) =>
      runMutation((current) => applyUpdateStopLocation(current, stopId, coords)),
    [runMutation],
  );

  const assignDriverToRoute = useCallback(
    (routeId: string, driver: PlanningDriver) =>
      runMutation((current) => applyAssignDriverToRoute(current, routeId, driver)),
    [runMutation],
  );

  const removeDriverFromRoute = useCallback(
    (routeId: string) => runMutation((current) => applyRemoveDriverFromRoute(current, routeId)),
    [runMutation],
  );

  const setDriverAssignmentLocked = useCallback((routeId: string, locked: boolean): boolean => {
    const next = applySetDriverAssignmentLocked(fixtureRef.current, routeId, locked);
    if (!next) return false;
    fixtureRef.current = next;
    setFixture(next);
    return true;
  }, []);

  const replaceFixture = useCallback((next: PlanningPlanFixture) => {
    fixtureRef.current = next;
    setFixture(next);
  }, []);

  return {
    fixture,
    replaceFixture,
    isPending,
    /** @deprecated alias — prefer isPending */
    isAssigning: isPending,
    assignStopToRoute,
    moveStopToRoute,
    removeStopFromRoute,
    moveOrderToRoute,
    updateStopLocation,
    assignDriverToRoute,
    removeDriverFromRoute,
    setDriverAssignmentLocked,
  };
}
