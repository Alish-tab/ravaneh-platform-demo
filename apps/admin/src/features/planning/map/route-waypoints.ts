import type { PlanningDepot, PlanningRoute, PlanningStop } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

/** Ordered stops by fixture sequence. */
export function orderedRouteStops(route: PlanningRoute): PlanningStop[] {
  return [...route.stops].sort((a, b) => a.seq - b.seq);
}

/** Depot + ordered stop coordinates used as OSRM / fallback waypoints. */
export function routeWaypoints(depot: PlanningDepot, route: PlanningRoute): LatLngTuple[] {
  const stops = orderedRouteStops(route);
  return [[depot.lat, depot.lng], ...stops.map((stop) => [stop.lat, stop.lng] as LatLngTuple)];
}

export function routeOrderCount(route: PlanningRoute): number {
  return route.stops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}

export function routeStopPositions(route: PlanningRoute): LatLngTuple[] {
  return orderedRouteStops(route).map((stop) => [stop.lat, stop.lng]);
}

export function geometryCacheKey(routeId: string, waypoints: LatLngTuple[]): string {
  const fingerprint = waypoints.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
  return `${routeId}::${fingerprint}`;
}
