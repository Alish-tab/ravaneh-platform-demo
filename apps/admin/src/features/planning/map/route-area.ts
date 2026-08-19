import { featureCollection, point } from '@turf/helpers';
import { concave as turfConcave } from '@turf/concave';
import { convex as turfConvex } from '@turf/convex';

import type { PlanningArea, PlanningStop } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

export type RouteAreaResult = {
  positions: LatLngTuple[];
  source: 'concave' | 'convex';
};

/**
 * Derive a geographic delivery-area polygon from explicit member Stop coordinates.
 * Visualization only — membership is never inferred from this polygon.
 */
export function deriveRouteArea(
  stops: Array<Pick<PlanningStop, 'lat' | 'lng'>>,
): RouteAreaResult | null {
  const coords = stops.map((stop) => [stop.lng, stop.lat] as [number, number]);
  if (coords.length < 3) return null;

  const pts = featureCollection(coords.map((coord) => point(coord)));

  try {
    const concave = turfConcave(pts, { maxEdge: 0.08 });
    const ring = concave?.geometry?.coordinates?.[0];
    if (ring && ring.length >= 4) {
      return {
        positions: ring.map(([lng, lat]) => [lat, lng] as LatLngTuple),
        source: 'concave',
      };
    }
  } catch {
    /* fall through to convex */
  }

  try {
    const convex = turfConvex(pts);
    const ring = convex?.geometry?.coordinates?.[0];
    if (ring && ring.length >= 4) {
      return {
        positions: ring.map(([lng, lat]) => [lat, lng] as LatLngTuple),
        source: 'convex',
      };
    }
  } catch {
    /* no valid polygon */
  }

  return null;
}

export type RouteAreaEntry = {
  areaId: string;
  /** @deprecated Use areaId. Kept so map stubs can still key polygons. */
  routeId: string;
  color: string;
  planState: PlanningArea['planState'];
  area: RouteAreaResult | null;
};

/** Build visualization polygons from explicit Area membership (not Turf containment). */
export function buildRouteAreas(areas: PlanningArea[]): RouteAreaEntry[] {
  return areas.map((item) => ({
    areaId: item.areaId,
    routeId: item.areaId,
    color: item.color,
    planState: item.planState,
    area: deriveRouteArea(item.stops),
  }));
}
