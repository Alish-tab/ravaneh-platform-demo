import {
  isUnassignedStopFullyExcluded,
} from '@/features/planning/fixture/exclude-order';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';

/**
 * Assign an unassigned stop to a route (frontend-only fixture mutation).
 * Inserts at end of the route sequence — temporary until optimization exists.
 * Returns null if the stop or route cannot be found, or if the stop is fully excluded.
 */
export function assignStopToRoute(
  fixture: PlanningPlanFixture,
  unassignedStopId: string,
  routeId: string,
  excludedOrderIds: ReadonlySet<string> = new Set(),
): PlanningPlanFixture | null {
  const stopIndex = fixture.unassignedStops.findIndex((stop) => stop.stopId === unassignedStopId);
  if (stopIndex < 0) return null;

  const routeIndex = fixture.routes.findIndex((route) => route.routeId === routeId);
  if (routeIndex < 0) return null;

  const stop = fixture.unassignedStops[stopIndex]!;
  if (isUnassignedStopFullyExcluded(stop, excludedOrderIds)) return null;

  const route = fixture.routes[routeIndex]!;
  const nextSeq =
    route.stops.length === 0
      ? 1
      : Math.max(...route.stops.map((item) => item.seq)) + 1;

  const nextRoutes = fixture.routes.map((item, index) => {
    if (index !== routeIndex) return item;
    return {
      ...item,
      stops: [...item.stops, { ...stop, seq: nextSeq }],
    };
  });

  return {
    ...fixture,
    routes: nextRoutes,
    unassignedStops: fixture.unassignedStops.filter((item) => item.stopId !== unassignedStopId),
  };
}
