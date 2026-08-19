import type { PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';
import { markRoutesDirty } from '@/features/planning/planning-model';

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

function updateOperational(stop: PlanningStop, coords: PlanningLatLng): PlanningStop {
  return {
    ...stop,
    lat: coords.lat,
    lng: coords.lng,
    rawLat: stop.rawLat,
    rawLng: stop.rawLng,
  };
}

/**
 * Commit corrected operational coordinates.
 * Raw imported coordinates are never overwritten.
 */
export function updateStopLocation(
  fixture: PlanningPlanFixture,
  stopId: string,
  coords: PlanningLatLng,
): PlanningPlanFixture | null {
  if (!isValidPlanningLatLng(coords)) return null;

  for (let areaIndex = 0; areaIndex < fixture.areas.length; areaIndex += 1) {
    const area = fixture.areas[areaIndex]!;
    const stopIndex = area.stops.findIndex((stop) => stop.stopId === stopId);
    if (stopIndex < 0) continue;

    const areas = fixture.areas.map((item, index) => {
      if (index !== areaIndex) return item;
      return {
        ...item,
        stops: item.stops.map((stop, i) =>
          i === stopIndex ? updateOperational(stop, coords) : stop,
        ),
      };
    });

    return markRoutesDirty(
      { ...fixture, areas },
      [area.areaId],
      ['location-corrected'],
    );
  }

  const unassignedIndex = fixture.unassignedStops.findIndex((stop) => stop.stopId === stopId);
  if (unassignedIndex < 0) return null;

  return {
    ...fixture,
    unassignedStops: fixture.unassignedStops.map((stop, index) =>
      index === unassignedIndex ? updateOperational(stop, coords) : stop,
    ),
    lastMutationImpact: {
      affectedAreaIds: [],
      dirtyRouteIds: [],
      planningAttention: ['location-corrected'],
    },
  };
}
