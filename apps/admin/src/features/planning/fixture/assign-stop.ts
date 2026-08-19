import {
  isUnassignedStopFullyExcluded,
} from '@/features/planning/fixture/exclude-order';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { markRoutesDirty, syncAreaMembership, syncRouteOrderFromArea } from '@/features/planning/planning-model';

/**
 * Assign an unassigned Physical Stop to an Area (membership only — coordinates unchanged).
 */
export function assignStopToRoute(
  fixture: PlanningPlanFixture,
  unassignedStopId: string,
  areaId: string,
  excludedOrderIds: ReadonlySet<string> = new Set(),
): PlanningPlanFixture | null {
  const stopIndex = fixture.unassignedStops.findIndex((stop) => stop.stopId === unassignedStopId);
  if (stopIndex < 0) return null;

  const areaIndex = fixture.areas.findIndex((area) => area.areaId === areaId);
  if (areaIndex < 0) return null;

  const stop = fixture.unassignedStops[stopIndex]!;
  if (isUnassignedStopFullyExcluded(stop, excludedOrderIds)) return null;

  const dest = fixture.areas[areaIndex]!;
  const nextSeq =
    dest.stops.length === 0 ? 1 : Math.max(...dest.stops.map((item) => item.seq)) + 1;

  const areas = fixture.areas.map((item, index) => {
    if (index !== areaIndex) return item;
    return syncAreaMembership({
      ...item,
      stops: [...item.stops, { ...stop, seq: nextSeq, lat: stop.lat, lng: stop.lng }],
    });
  });

  const next: PlanningPlanFixture = {
    ...fixture,
    areas,
    routes: fixture.routes.map((route) => {
      const nextArea = areas.find((item) => item.areaId === route.areaId);
      return nextArea ? syncRouteOrderFromArea(nextArea, route) : route;
    }),
    unassignedStops: fixture.unassignedStops.filter((item) => item.stopId !== unassignedStopId),
  };

  return markRoutesDirty(next, [areaId]);
}
