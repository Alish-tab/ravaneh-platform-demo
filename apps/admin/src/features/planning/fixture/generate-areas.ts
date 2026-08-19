/**
 * Fixture-local area generation. Not a real optimizer and not a network call.
 * Membership is assigned explicitly — never via point-in-polygon.
 */

import {
  PLANNING_AREA_COLORS,
  syncAreaMembership,
  syncRouteOrderFromArea,
} from '@/features/planning/planning-model';
import type {
  PlanningArea,
  PlanningPlanFixture,
  PlanningRoute,
  PlanningStop,
} from '@/features/planning/fixture/types';
import type { PlanningGenerationPhase } from '@/features/planning/generation';

const AREA_LABELS = (index: number) => `محدوده ${index}`;

export type GenerateAreasOptions = {
  targetCount: number;
  /** When true, last leftover stop stays without Area. */
  leaveUnassigned?: boolean;
  preserveLockedDrivers?: Array<{
    driverId: string;
    driverName: string;
  }>;
};

function reindex(stops: PlanningStop[]): PlanningStop[] {
  return stops.map((stop, index) => ({ ...stop, seq: index + 1 }));
}

/**
 * Partition explicit member stops into N areas by a stable geographic sort.
 * Does not use Turf containment.
 */
export function partitionStopsIntoAreas(
  stops: PlanningStop[],
  options: GenerateAreasOptions,
): { areas: PlanningArea[]; routes: PlanningRoute[]; unassignedStops: PlanningStop[] } {
  const sorted = [...stops].sort((a, b) => a.lng - b.lng || a.lat - b.lat);
  let working = sorted;
  let unassignedStops: PlanningStop[] = [];

  if (options.leaveUnassigned && working.length > 0) {
    const last = working[working.length - 1]!;
    working = working.slice(0, -1);
    unassignedStops = [{ ...last, seq: 0 }];
  }

  const count = Math.max(1, Math.min(options.targetCount, Math.max(working.length, 1)));
  const buckets: PlanningStop[][] = Array.from({ length: count }, () => []);
  working.forEach((stop, index) => {
    buckets[index % count]!.push(stop);
  });

  const areas: PlanningArea[] = [];
  const routes: PlanningRoute[] = [];

  buckets.forEach((bucket, index) => {
    if (bucket.length === 0) return;
    const areaId = `A-${String(index + 1).padStart(2, '0')}`;
    const routeId = `RT-${String(index + 1).padStart(2, '0')}`;
    const locked = options.preserveLockedDrivers?.[index];
    const area = syncAreaMembership({
      areaId,
      label: AREA_LABELS(index + 1),
      color: PLANNING_AREA_COLORS[index % PLANNING_AREA_COLORS.length]!,
      memberStopIds: [],
      driverId: locked?.driverId ?? null,
      driverName: locked?.driverName ?? null,
      driverAssignmentLocked: Boolean(locked),
      stops: reindex(bucket),
      planState: locked ? 'assigned' : 'draft',
    });
    const route: PlanningRoute = syncRouteOrderFromArea(area, {
      routeId,
      areaId,
      orderedStopIds: [],
      dirty: false,
      recalcState: 'idle',
      distanceKm: Math.max(8, bucket.length * 9),
      durationMin: Math.max(20, bucket.length * 18),
    });
    areas.push(area);
    routes.push(route);
  });

  return { areas, routes, unassignedStops };
}

export function applyGeneratedAreas(
  fixture: PlanningPlanFixture,
  stops: PlanningStop[],
  options: GenerateAreasOptions,
  phase: PlanningGenerationPhase = 'generated',
): PlanningPlanFixture {
  const partitioned = partitionStopsIntoAreas(stops, options);
  return {
    ...fixture,
    areas: partitioned.areas,
    routes: partitioned.routes,
    unassignedStops: partitioned.unassignedStops,
    generationPhase: phase,
    targetAreaCount: options.targetCount,
    lastMutationImpact: {
      affectedAreaIds: partitioned.areas.map((area) => area.areaId),
      dirtyRouteIds: [],
      planningAttention: partitioned.unassignedStops.length > 0 ? ['unassigned'] : [],
    },
  };
}

export function recalculateRoutes(fixture: PlanningPlanFixture): PlanningPlanFixture {
  return {
    ...fixture,
    routes: fixture.routes.map((route) => ({
      ...route,
      dirty: false,
      recalcState: 'idle',
    })),
    areas: fixture.areas.map((area) =>
      area.planState === 'modified' ? { ...area, planState: area.driverId ? 'assigned' : 'draft' } : area,
    ),
    upstreamSpatialAttention: false,
    lastMutationImpact: {
      affectedAreaIds: fixture.areas.map((area) => area.areaId),
      dirtyRouteIds: [],
      planningAttention: [],
    },
  };
}

export function beginRecalculateRoutes(fixture: PlanningPlanFixture): PlanningPlanFixture {
  return {
    ...fixture,
    routes: fixture.routes.map((route) =>
      route.dirty || route.recalcState === 'required'
        ? { ...route, recalcState: 'recalculating' }
        : route,
    ),
  };
}

export function failRecalculateRoutes(fixture: PlanningPlanFixture): PlanningPlanFixture {
  return {
    ...fixture,
    routes: fixture.routes.map((route) =>
      route.recalcState === 'recalculating' ? { ...route, recalcState: 'failed' } : route,
    ),
  };
}
