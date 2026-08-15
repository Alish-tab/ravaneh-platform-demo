import type {
  PlanningDeliveryTask,
  PlanningPlanFixture,
  PlanningStop,
} from '@/features/planning/fixture/types';

function sortBySeq(stops: PlanningStop[]): PlanningStop[] {
  return [...stops].sort((a, b) => a.seq - b.seq);
}

function reindexStops(stops: PlanningStop[]): PlanningStop[] {
  return sortBySeq(stops).map((stop, index) => ({ ...stop, seq: index + 1 }));
}

function nextSeq(stops: PlanningStop[]): number {
  if (stops.length === 0) return 1;
  return Math.max(...stops.map((item) => item.seq)) + 1;
}

function sameDeliveryLocation(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

function findRoutedStop(
  fixture: PlanningPlanFixture,
  stopId: string,
): { routeIndex: number; stopIndex: number; stop: PlanningStop } | null {
  for (let routeIndex = 0; routeIndex < fixture.routes.length; routeIndex += 1) {
    const route = fixture.routes[routeIndex]!;
    const stopIndex = route.stops.findIndex((item) => item.stopId === stopId);
    if (stopIndex >= 0) {
      return { routeIndex, stopIndex, stop: route.stops[stopIndex]! };
    }
  }
  return null;
}

/**
 * Move a routed stop to another route (frontend-only).
 * Appends at end of destination — temporary until optimization exists.
 * Reindexes the source route sequence after removal.
 */
export function moveStopToRoute(
  fixture: PlanningPlanFixture,
  stopId: string,
  toRouteId: string,
): PlanningPlanFixture | null {
  const found = findRoutedStop(fixture, stopId);
  if (!found) return null;

  const fromRoute = fixture.routes[found.routeIndex]!;
  if (fromRoute.routeId === toRouteId) return null;

  const toRouteIndex = fixture.routes.findIndex((route) => route.routeId === toRouteId);
  if (toRouteIndex < 0) return null;

  const toRoute = fixture.routes[toRouteIndex]!;
  const moved = { ...found.stop, seq: nextSeq(toRoute.stops) };
  const sourceRemaining = reindexStops(
    fromRoute.stops.filter((item) => item.stopId !== stopId),
  );

  const nextRoutes = fixture.routes.map((route, index) => {
    if (index === found.routeIndex) {
      return { ...route, stops: sourceRemaining };
    }
    if (index === toRouteIndex) {
      return { ...route, stops: [...route.stops, moved] };
    }
    return route;
  });

  return { ...fixture, routes: nextRoutes };
}

/**
 * Remove a stop from its route into the unassigned queue (frontend-only).
 * Reindexes the source route sequence after removal.
 */
export function removeStopFromRoute(
  fixture: PlanningPlanFixture,
  stopId: string,
): PlanningPlanFixture | null {
  const found = findRoutedStop(fixture, stopId);
  if (!found) return null;

  if (fixture.unassignedStops.some((item) => item.stopId === stopId)) return null;

  const sourceRemaining = reindexStops(
    fixture.routes[found.routeIndex]!.stops.filter((item) => item.stopId !== stopId),
  );

  const nextRoutes = fixture.routes.map((route, index) => {
    if (index !== found.routeIndex) return route;
    return { ...route, stops: sourceRemaining };
  });

  return {
    ...fixture,
    routes: nextRoutes,
    unassignedStops: [...fixture.unassignedStops, { ...found.stop, seq: 0 }],
  };
}

export type MoveOrderResult = {
  fixture: PlanningPlanFixture;
  destinationStopId: string;
};

/**
 * Move a single order/task from a multi-order (or single-order) stop to another route.
 * Merges into an existing destination stop at the same lat/lng when present;
 * otherwise appends a new stop at the end of the destination sequence.
 */
export function moveOrderToRoute(
  fixture: PlanningPlanFixture,
  orderId: string,
  toRouteId: string,
): MoveOrderResult | null {
  let sourceRouteIndex = -1;
  let sourceStopIndex = -1;
  let task: PlanningDeliveryTask | null = null;

  for (let routeIndex = 0; routeIndex < fixture.routes.length; routeIndex += 1) {
    const route = fixture.routes[routeIndex]!;
    for (let stopIndex = 0; stopIndex < route.stops.length; stopIndex += 1) {
      const stop = route.stops[stopIndex]!;
      const foundTask = stop.tasks.find((item) => item.orderId === orderId);
      if (foundTask) {
        sourceRouteIndex = routeIndex;
        sourceStopIndex = stopIndex;
        task = foundTask;
        break;
      }
    }
    if (task) break;
  }

  if (!task || sourceRouteIndex < 0) return null;

  const fromRoute = fixture.routes[sourceRouteIndex]!;
  if (fromRoute.routeId === toRouteId) return null;

  const toRouteIndex = fixture.routes.findIndex((route) => route.routeId === toRouteId);
  if (toRouteIndex < 0) return null;

  const sourceStop = fromRoute.stops[sourceStopIndex]!;
  const remainingTasks = sourceStop.tasks.filter((item) => item.orderId !== orderId);
  const toRoute = fixture.routes[toRouteIndex]!;

  const mergeIndex = toRoute.stops.findIndex((stop) =>
    sameDeliveryLocation(stop, sourceStop),
  );

  let destinationStopId: string;
  let nextDestStops: PlanningStop[];

  if (mergeIndex >= 0) {
    const mergeTarget = toRoute.stops[mergeIndex]!;
    destinationStopId = mergeTarget.stopId;
    nextDestStops = toRoute.stops.map((stop, index) =>
      index === mergeIndex
        ? { ...stop, tasks: [...stop.tasks, task!] }
        : stop,
    );
  } else {
    destinationStopId = `${sourceStop.stopId}-${orderId}-xfer`;
    const created: PlanningStop = {
      stopId: destinationStopId,
      seq: nextSeq(toRoute.stops),
      lat: sourceStop.lat,
      lng: sourceStop.lng,
      tasks: [task],
    };
    nextDestStops = [...toRoute.stops, created];
  }

  const nextSourceStops =
    remainingTasks.length === 0
      ? reindexStops(fromRoute.stops.filter((_, index) => index !== sourceStopIndex))
      : fromRoute.stops.map((stop, index) =>
          index === sourceStopIndex ? { ...stop, tasks: remainingTasks } : stop,
        );

  const nextRoutes = fixture.routes.map((route, index) => {
    if (index === sourceRouteIndex) {
      return { ...route, stops: nextSourceStops };
    }
    if (index === toRouteIndex) {
      return { ...route, stops: nextDestStops };
    }
    return route;
  });

  return {
    fixture: { ...fixture, routes: nextRoutes },
    destinationStopId,
  };
}
