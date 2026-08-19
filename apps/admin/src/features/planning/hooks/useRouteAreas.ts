import { useMemo } from 'react';

import {
  buildRouteAreas,
  type RouteAreaEntry,
} from '@/features/planning/map/route-area';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

/**
 * Derive area polygons once per fixture (sync Turf work — visualization only).
 */
export function useRouteAreas(fixture: PlanningPlanFixture): RouteAreaEntry[] {
  return useMemo(() => buildRouteAreas(fixture.areas), [fixture.areas]);
}

export function areaPositionsForRoute(
  areas: RouteAreaEntry[],
  areaId: string | null,
): LatLngTuple[] | null {
  if (!areaId) return null;
  const entry = areas.find((item) => item.areaId === areaId || item.routeId === areaId);
  return entry?.area?.positions ?? null;
}
