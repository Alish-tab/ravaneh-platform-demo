import { useEffect, useState } from 'react';

import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import {
  resolveRouteGeometry,
  type LatLngTuple,
  type RouteGeometryResult,
} from '@/features/planning/map/osrm';
import { geometryCacheKey, routeWaypoints } from '@/features/planning/map/route-waypoints';

export type RouteGeometryEntry = RouteGeometryResult & {
  routeId: string;
};

/** Session cache — avoid repeat public OSRM calls for the same waypoints. */
const sessionGeometryCache = new Map<string, RouteGeometryResult>();

/**
 * Resolve road-following (or fallback) geometry once per route for the current fixture.
 * Does not refetch on selection changes.
 */
export function useRouteGeometries(fixture: PlanningPlanFixture): Record<string, RouteGeometryEntry> {
  const [geometries, setGeometries] = useState<Record<string, RouteGeometryEntry>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next: Record<string, RouteGeometryEntry> = {};

      await Promise.all(
        fixture.routes.map(async (route) => {
          const waypoints = routeWaypoints(fixture.depot, route);
          const cacheKey = geometryCacheKey(route.routeId, waypoints);

          let result = sessionGeometryCache.get(cacheKey);
          if (!result) {
            result = await resolveRouteGeometry(waypoints);
            sessionGeometryCache.set(cacheKey, result);
          }

          next[route.routeId] = { routeId: route.routeId, ...result };
        }),
      );

      if (!cancelled) {
        setGeometries(next);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [fixture]);

  return geometries;
}

export function geometryPositions(
  geometries: Record<string, RouteGeometryEntry>,
  routeId: string,
): LatLngTuple[] | null {
  const entry = geometries[routeId];
  return entry && entry.positions.length >= 2 ? entry.positions : null;
}

/** Clear session cache — tests only. */
export function __clearRouteGeometrySessionCacheForTests(): void {
  sessionGeometryCache.clear();
}
