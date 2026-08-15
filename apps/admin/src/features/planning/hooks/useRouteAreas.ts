import { useMemo } from 'react';

import {
  buildRouteAreas,
  type RouteAreaEntry,
} from '@/features/planning/map/route-area';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import type { LatLngTuple } from '@/features/planning/map/osrm';

/**
 * Derive route-area polygons once per fixture (sync Turf work — no network).
 */
export function useRouteAreas(fixture: PlanningPlanFixture): RouteAreaEntry[] {
  return useMemo(() => buildRouteAreas(fixture.routes), [fixture.routes]);
}

export function areaPositionsForRoute(
  areas: RouteAreaEntry[],
  routeId: string | null,
): LatLngTuple[] | null {
  if (!routeId) return null;
  const entry = areas.find((item) => item.routeId === routeId);
  return entry?.area?.positions ?? null;
}
