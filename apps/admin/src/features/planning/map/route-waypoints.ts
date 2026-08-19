import type { PlanningArea, PlanningDepot, PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';
import { orderedStopsForArea } from '@/features/planning/planning-model';
import type { LatLngTuple } from '@/features/planning/map/osrm';

/** Ordered stops by Area membership / Route order. */
export function orderedRouteStops(
  area: PlanningArea,
  fixture?: PlanningPlanFixture,
): PlanningStop[] {
  if (fixture) return orderedStopsForArea(fixture, area);
  return [...area.stops].sort((a, b) => a.seq - b.seq);
}

/** Depot (when present) + ordered stop coordinates. Fixture-local geometry only. */
export function routeWaypoints(
  depot: PlanningDepot | null,
  area: PlanningArea,
  fixture?: PlanningPlanFixture,
): LatLngTuple[] {
  const stops = orderedRouteStops(area, fixture);
  const points = stops.map((stop) => [stop.lat, stop.lng] as LatLngTuple);
  if (depot) return [[depot.lat, depot.lng], ...points];
  return points;
}

export function routeOrderCount(area: PlanningArea): number {
  return area.stops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}

export function routeStopPositions(
  area: PlanningArea,
  fixture?: PlanningPlanFixture,
): LatLngTuple[] {
  return orderedRouteStops(area, fixture).map((stop) => [stop.lat, stop.lng]);
}

export function geometryCacheKey(areaId: string, waypoints: LatLngTuple[]): string {
  const fingerprint = waypoints.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
  return `${areaId}::${fingerprint}`;
}
