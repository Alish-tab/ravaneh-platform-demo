import type { PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';

export type PlanningLatLng = { lat: number; lng: number };

export function isValidPlanningLatLng(coords: PlanningLatLng): boolean {
  return (
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}

function updateStopCoords(stop: PlanningStop, coords: PlanningLatLng): PlanningStop {
  return { ...stop, lat: coords.lat, lng: coords.lng };
}

/**
 * Commit corrected coordinates for a routed or unassigned stop.
 * Preserves ownership, tasks, sequence, and unrelated fields.
 */
export function updateStopLocation(
  fixture: PlanningPlanFixture,
  stopId: string,
  coords: PlanningLatLng,
): PlanningPlanFixture | null {
  if (!isValidPlanningLatLng(coords)) return null;

  for (let routeIndex = 0; routeIndex < fixture.routes.length; routeIndex += 1) {
    const route = fixture.routes[routeIndex]!;
    const stopIndex = route.stops.findIndex((stop) => stop.stopId === stopId);
    if (stopIndex < 0) continue;

    const nextRoutes = fixture.routes.map((item, index) => {
      if (index !== routeIndex) return item;
      return {
        ...item,
        stops: item.stops.map((stop, i) =>
          i === stopIndex ? updateStopCoords(stop, coords) : stop,
        ),
      };
    });
    return { ...fixture, routes: nextRoutes };
  }

  const unassignedIndex = fixture.unassignedStops.findIndex((stop) => stop.stopId === stopId);
  if (unassignedIndex < 0) return null;

  return {
    ...fixture,
    unassignedStops: fixture.unassignedStops.map((stop, index) =>
      index === unassignedIndex ? updateStopCoords(stop, coords) : stop,
    ),
  };
}
