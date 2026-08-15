import { featureCollection, point } from '@turf/helpers';
import { concave as turfConcave } from '@turf/concave';
import { convex as turfConvex } from '@turf/convex';

import type { PlanningRoute, PlanningStop } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

export type RouteAreaResult = {
  positions: LatLngTuple[];
  source: 'concave' | 'convex';
};

/**
 * Derive a geographic delivery-area polygon from route stop coordinates.
 * Matches A03: concave(maxEdge 0.08) → convex fallback → null.
 * Depot is NOT included (designer uses stops only).
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
  routeId: string;
  color: string;
  planState: PlanningRoute['planState'];
  area: RouteAreaResult | null;
};

/** Build area entries for every fixture route (null area when degenerate). */
export function buildRouteAreas(routes: PlanningRoute[]): RouteAreaEntry[] {
  return routes.map((route) => ({
    routeId: route.routeId,
    color: route.color,
    planState: route.planState,
    area: deriveRouteArea(route.stops),
  }));
}
