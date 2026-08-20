import type { PlanningArea, PlanningStop } from '@/features/planning/fixture/types';
import {
  deriveAreaGeometry,
  type MapAreaGeometry,
  type MapCoordinate,
} from '@/shared/map/area-geometry';

export type RouteAreaResult = MapAreaGeometry;

/**
 * Derive a geographic delivery-area polygon from explicit member Stop coordinates.
 * Visualization only — membership is never inferred from this polygon.
 */
export function deriveRouteArea(
  stops: Array<Pick<PlanningStop, 'lat' | 'lng'>>,
): RouteAreaResult | null {
  return deriveAreaGeometry(
    stops.map(({ lat, lng }) => [lat, lng] as MapCoordinate),
  );
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
