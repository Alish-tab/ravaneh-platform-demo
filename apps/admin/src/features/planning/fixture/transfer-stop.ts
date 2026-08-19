import type {
  PlanningDeliveryTask,
  PlanningPlanFixture,
  PlanningStop,
} from '@/features/planning/fixture/types';
import {
  markRoutesDirty,
  syncAreaMembership,
  syncRouteOrderFromArea,
} from '@/features/planning/planning-model';

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

function findAssignedStop(
  fixture: PlanningPlanFixture,
  stopId: string,
): { areaIndex: number; stopIndex: number; stop: PlanningStop } | null {
  for (let areaIndex = 0; areaIndex < fixture.areas.length; areaIndex += 1) {
    const area = fixture.areas[areaIndex]!;
    const stopIndex = area.stops.findIndex((item) => item.stopId === stopId);
    if (stopIndex >= 0) {
      return { areaIndex, stopIndex, stop: area.stops[stopIndex]! };
    }
  }
  return null;
}

function withSyncedRoutes(fixture: PlanningPlanFixture): PlanningPlanFixture {
  return {
    ...fixture,
    areas: fixture.areas.map(syncAreaMembership),
    routes: fixture.routes.map((route) => {
      const area = fixture.areas.find((item) => item.areaId === route.areaId);
      return area ? syncRouteOrderFromArea(area, route) : route;
    }),
  };
}

/**
 * Move a Physical Stop to another Area (membership only).
 * Coordinates are unchanged. Affected routes become dirty via returned impact.
 */
export function moveStopToRoute(
  fixture: PlanningPlanFixture,
  stopId: string,
  toAreaId: string,
): PlanningPlanFixture | null {
  const found = findAssignedStop(fixture, stopId);
  if (!found) return null;

  const fromArea = fixture.areas[found.areaIndex]!;
  if (fromArea.areaId === toAreaId) return null;

  const toAreaIndex = fixture.areas.findIndex((area) => area.areaId === toAreaId);
  if (toAreaIndex < 0) return null;

  const toArea = fixture.areas[toAreaIndex]!;
  const moved = { ...found.stop, seq: nextSeq(toArea.stops), lat: found.stop.lat, lng: found.stop.lng };
  const sourceRemaining = reindexStops(
    fromArea.stops.filter((item) => item.stopId !== stopId),
  );

  const areas = fixture.areas.map((area, index) => {
    if (index === found.areaIndex) {
      return syncAreaMembership({ ...area, stops: sourceRemaining });
    }
    if (index === toAreaIndex) {
      return syncAreaMembership({ ...area, stops: [...area.stops, moved] });
    }
    return area;
  });

  const next = withSyncedRoutes({ ...fixture, areas });
  return markRoutesDirty(next, [fromArea.areaId, toAreaId]);
}

/**
 * Remove a stop from its Area into the unassigned queue.
 */
export function removeStopFromRoute(
  fixture: PlanningPlanFixture,
  stopId: string,
): PlanningPlanFixture | null {
  const found = findAssignedStop(fixture, stopId);
  if (!found) return null;

  if (fixture.unassignedStops.some((item) => item.stopId === stopId)) return null;

  const fromArea = fixture.areas[found.areaIndex]!;
  const sourceRemaining = reindexStops(
    fromArea.stops.filter((item) => item.stopId !== stopId),
  );

  const areas = fixture.areas.map((area, index) => {
    if (index !== found.areaIndex) return area;
    return syncAreaMembership({ ...area, stops: sourceRemaining });
  });

  const next = withSyncedRoutes({
    ...fixture,
    areas,
    unassignedStops: [...fixture.unassignedStops, { ...found.stop, seq: 0 }],
  });
  return markRoutesDirty(next, [fromArea.areaId]);
}

export type MoveOrderResult = {
  fixture: PlanningPlanFixture;
  destinationStopId: string;
};

/**
 * Move a single Order from a (possibly multi-order) Physical Stop to another Area.
 * Does not move sibling Orders. Does not change coordinates.
 * Does not merge by lat/lng — destination is a new Physical Stop unless the port says otherwise.
 */
export function moveOrderToRoute(
  fixture: PlanningPlanFixture,
  orderId: string,
  toAreaId: string,
): MoveOrderResult | null {
  let sourceAreaIndex = -1;
  let sourceStopIndex = -1;
  let task: PlanningDeliveryTask | null = null;

  for (let areaIndex = 0; areaIndex < fixture.areas.length; areaIndex += 1) {
    const area = fixture.areas[areaIndex]!;
    for (let stopIndex = 0; stopIndex < area.stops.length; stopIndex += 1) {
      const foundTask = area.stops[stopIndex]!.tasks.find((item) => item.orderId === orderId);
      if (foundTask) {
        sourceAreaIndex = areaIndex;
        sourceStopIndex = stopIndex;
        task = foundTask;
        break;
      }
    }
    if (task) break;
  }

  if (!task || sourceAreaIndex < 0) return null;

  const fromArea = fixture.areas[sourceAreaIndex]!;
  if (fromArea.areaId === toAreaId) return null;

  const toAreaIndex = fixture.areas.findIndex((area) => area.areaId === toAreaId);
  if (toAreaIndex < 0) return null;

  const sourceStop = fromArea.stops[sourceStopIndex]!;
  const remainingTasks = sourceStop.tasks.filter((item) => item.orderId !== orderId);
  const toArea = fixture.areas[toAreaIndex]!;

  const destinationStopId = `${sourceStop.stopId}-${orderId}-xfer`;
  const created: PlanningStop = {
    stopId: destinationStopId,
    seq: nextSeq(toArea.stops),
    lat: sourceStop.lat,
    lng: sourceStop.lng,
    rawLat: sourceStop.rawLat,
    rawLng: sourceStop.rawLng,
    tasks: [task],
  };

  const nextSourceStops =
    remainingTasks.length === 0
      ? reindexStops(fromArea.stops.filter((_, index) => index !== sourceStopIndex))
      : fromArea.stops.map((item, index) =>
          index === sourceStopIndex ? { ...item, tasks: remainingTasks } : item,
        );

  const areas = fixture.areas.map((area, index) => {
    if (index === sourceAreaIndex) {
      return syncAreaMembership({ ...area, stops: nextSourceStops });
    }
    if (index === toAreaIndex) {
      return syncAreaMembership({ ...area, stops: [...area.stops, created] });
    }
    return area;
  });

  const next = markRoutesDirty(withSyncedRoutes({ ...fixture, areas }), [
    fromArea.areaId,
    toAreaId,
  ]);

  return {
    fixture: next,
    destinationStopId,
  };
}
