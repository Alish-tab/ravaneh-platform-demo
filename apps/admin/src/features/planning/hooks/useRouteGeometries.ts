import { useMemo } from 'react';

import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { straightLineGeometry, type LatLngTuple, type RouteGeometryResult } from '@/features/planning/map/osrm';
import { geometryCacheKey, routeWaypoints } from '@/features/planning/map/route-waypoints';

export type RouteGeometryEntry = RouteGeometryResult & {
  areaId: string;
  routeId: string;
};

/**
 * Fixture-local route visualization from ordered Stop points.
 * Does not call OSRM / Neshan — routing authority is Backend/port.
 */
export function useRouteGeometries(fixture: PlanningPlanFixture): Record<string, RouteGeometryEntry> {
  return useMemo(() => {
    const next: Record<string, RouteGeometryEntry> = {};
    for (const area of fixture.areas) {
      const route = fixture.routes.find((item) => item.areaId === area.areaId);
      const waypoints = routeWaypoints(fixture.depot, area, fixture);
      const positions = straightLineGeometry(waypoints);
      const routeId = route?.routeId ?? `RT-${area.areaId}`;
      next[area.areaId] = {
        areaId: area.areaId,
        routeId,
        positions,
        source: 'straight',
      };
      void geometryCacheKey(area.areaId, waypoints);
    }
    return next;
  }, [fixture]);
}

export function geometryPositions(
  geometries: Record<string, RouteGeometryEntry>,
  areaId: string,
): LatLngTuple[] | null {
  const entry = geometries[areaId];
  return entry && entry.positions.length >= 2 ? entry.positions : null;
}

/** @deprecated Session OSRM cache removed from Product path. */
export function __clearRouteGeometrySessionCacheForTests(): void {
  /* no-op — Product geometries are derived locally */
}
