/**
 * Feature-local Planning helpers.
 * Area membership is explicit. Polygons are visualization only.
 */

import type { ReviewItem } from '@/features/import-review/review-types';
import type {
  PlanningArea,
  PlanningDeliveryTask,
  PlanningMutationImpact,
  PlanningPlanFixture,
  PlanningPublishReadiness,
  PlanningRoute,
  PlanningStop,
} from '@/features/planning/fixture/types';

export const PLANNING_AREA_COLORS = [
  '#7a8fd0',
  '#9a78a8',
  '#5e8ab8',
  '#6aa38a',
  '#c99035',
  '#c45a6a',
  '#5b9e9a',
  '#8b7ec8',
];

export function syncAreaMembership(area: PlanningArea): PlanningArea {
  return {
    ...area,
    memberStopIds: area.stops.map((stop) => stop.stopId),
  };
}

export function findArea(
  fixture: PlanningPlanFixture,
  areaId: string,
): PlanningArea | null {
  return fixture.areas.find((area) => area.areaId === areaId) ?? null;
}

export function findRouteForArea(
  fixture: PlanningPlanFixture,
  areaId: string,
): PlanningRoute | null {
  return fixture.routes.find((route) => route.areaId === areaId) ?? null;
}

export function findRoute(
  fixture: PlanningPlanFixture,
  routeId: string,
): PlanningRoute | null {
  return fixture.routes.find((route) => route.routeId === routeId) ?? null;
}

export function areaAndRouteIdentitiesAreDistinct(fixture: PlanningPlanFixture): boolean {
  const areaIds = new Set(fixture.areas.map((area) => area.areaId));
  const routeIds = new Set(fixture.routes.map((route) => route.routeId));
  for (const route of fixture.routes) {
    if (areaIds.has(route.routeId)) return false;
    if (!areaIds.has(route.areaId)) return false;
  }
  for (const areaId of areaIds) {
    if (routeIds.has(areaId)) return false;
  }
  return true;
}

export function orderedStopsForArea(
  fixture: PlanningPlanFixture,
  area: PlanningArea,
): PlanningStop[] {
  const route = findRouteForArea(fixture, area.areaId);
  if (route && route.orderedStopIds.length > 0) {
    const byId = new Map(area.stops.map((stop) => [stop.stopId, stop]));
    const ordered: PlanningStop[] = [];
    for (const stopId of route.orderedStopIds) {
      const stop = byId.get(stopId);
      if (stop) ordered.push(stop);
    }
    for (const stop of area.stops) {
      if (!route.orderedStopIds.includes(stop.stopId)) ordered.push(stop);
    }
    return ordered;
  }
  return [...area.stops].sort((a, b) => a.seq - b.seq);
}

export function markRoutesDirty(
  fixture: PlanningPlanFixture,
  areaIds: string[],
  attention: string[] = ['route-dirty'],
): PlanningPlanFixture {
  const affected = new Set(areaIds);
  const dirtyRouteIds = fixture.routes
    .filter((route) => affected.has(route.areaId))
    .map((route) => route.routeId);

  const impact: PlanningMutationImpact = {
    affectedAreaIds: [...affected],
    dirtyRouteIds,
    planningAttention: attention,
  };

  return {
    ...fixture,
    routes: fixture.routes.map((route) =>
      affected.has(route.areaId)
        ? { ...route, dirty: true, recalcState: 'required' as const }
        : route,
    ),
    areas: fixture.areas.map((area) =>
      affected.has(area.areaId) && area.planState !== 'published'
        ? { ...area, planState: 'modified' as const }
        : area,
    ),
    lastMutationImpact: impact,
  };
}

export function syncRouteOrderFromArea(area: PlanningArea, route: PlanningRoute): PlanningRoute {
  return {
    ...route,
    orderedStopIds: area.stops.map((stop) => stop.stopId),
  };
}

export function allAssignedStops(fixture: PlanningPlanFixture): PlanningStop[] {
  return fixture.areas.flatMap((area) => area.stops);
}

export function areaOrderCount(area: PlanningArea): number {
  return area.stops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}

export function collectTasks(fixture: PlanningPlanFixture): PlanningDeliveryTask[] {
  const tasks: PlanningDeliveryTask[] = [];
  for (const area of fixture.areas) {
    for (const stop of area.stops) tasks.push(...stop.tasks);
  }
  for (const stop of fixture.unassignedStops) tasks.push(...stop.tasks);
  return tasks;
}

export type PlanningEligibleOrder = {
  orderId: string;
  reviewItemId: string;
  recipientName: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  rawLat: number | null;
  rawLng: number | null;
  physicalStopId: string;
  excluded: boolean;
  reviewBlocker: boolean;
};

function parseCoord(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/**
 * Planning-ready input from Working Review items.
 * Does not re-run Review rules. Eligible = not excluded + usable resolved location.
 */
export function eligibleOrdersFromReview(
  items: ReviewItem[],
  physicalStopGroups: string[][] = [],
): PlanningEligibleOrder[] {
  const stopByOrder = new Map<string, string>();
  physicalStopGroups.forEach((group, index) => {
    const stopId = `PS-group-${index + 1}`;
    for (const orderId of group) stopByOrder.set(orderId, stopId);
  });

  const eligible: PlanningEligibleOrder[] = [];
  for (const item of items) {
    if (item.state === 'excluded') continue;
    if (item.resolvedLat == null || item.resolvedLng == null) continue;
    const orderId = item.externalOrderId;
    eligible.push({
      orderId,
      reviewItemId: item.reviewItemId,
      recipientName: item.name,
      phone: item.phone,
      address: item.address,
      lat: item.resolvedLat,
      lng: item.resolvedLng,
      rawLat: parseCoord(item.rawLatitude),
      rawLng: parseCoord(item.rawLongitude),
      physicalStopId: stopByOrder.get(orderId) ?? `PS-${item.reviewItemId}`,
      excluded: false,
      reviewBlocker: item.state === 'review' || item.state === 'error',
    });
  }
  return eligible;
}

export function stopsFromEligibleOrders(orders: PlanningEligibleOrder[]): PlanningStop[] {
  const groups = new Map<string, PlanningEligibleOrder[]>();
  for (const order of orders) {
    const list = groups.get(order.physicalStopId) ?? [];
    list.push(order);
    groups.set(order.physicalStopId, list);
  }

  const stops: PlanningStop[] = [];
  let seq = 1;
  for (const [stopId, group] of groups) {
    const first = group[0]!;
    stops.push({
      stopId,
      seq: seq++,
      lat: first.lat,
      lng: first.lng,
      rawLat: first.rawLat,
      rawLng: first.rawLng,
      tasks: group.map((order) => ({
        taskId: `T-${order.reviewItemId}`,
        orderId: order.orderId,
        recipientName: order.recipientName,
        address: order.address,
        phone: order.phone,
      })),
    });
  }
  return stops;
}

export function evaluatePublishReadiness(
  fixture: PlanningPlanFixture,
  options: {
    excludedOrderIds?: ReadonlySet<string>;
    mutationInProgress?: boolean;
    driverConflicts?: boolean;
  } = {},
): PlanningPublishReadiness {
  const excluded =
    options.excludedOrderIds ?? new Set<string>(fixture.excludedOrderIds ?? []);
  const blockers: PlanningPublishReadiness['blockers'] = [];

  if (fixture.generationPhase !== 'generated') {
    blockers.push({
      code: 'unassigned-order',
      message: 'محدوده‌های توزیع هنوز ساخته نشده‌اند.',
    });
    return { canPublish: false, blockers };
  }

  const areasWithoutDriver = fixture.areas.filter((area) => !area.driverId);
  if (areasWithoutDriver.length > 0) {
    blockers.push({
      code: 'area-without-driver',
      message: `${areasWithoutDriver.length} محدوده بدون راننده`,
    });
  }

  const unassignedEligible = fixture.unassignedStops.reduce((sum, stop) => {
    return sum + stop.tasks.filter((task) => !excluded.has(task.orderId)).length;
  }, 0);
  if (unassignedEligible > 0) {
    blockers.push({
      code: 'unassigned-order',
      message: `${unassignedEligible} سفارش بدون محدوده`,
    });
  }

  const dirty = fixture.routes.filter((route) => route.dirty || route.recalcState === 'required');
  if (dirty.length > 0) {
    blockers.push({
      code: 'dirty-route',
      message: `${dirty.length} مسیر نیازمند محاسبه مجدد`,
    });
  }

  if (options.mutationInProgress) {
    blockers.push({
      code: 'mutation-in-progress',
      message: 'یک تغییر هنوز در حال انجام است.',
    });
  }

  if (options.driverConflicts) {
    blockers.push({
      code: 'planning-conflict',
      message: 'تداخل تخصیص راننده باید ابتدا رفع شود.',
    });
  }

  if (fixture.upstreamSpatialAttention) {
    blockers.push({
      code: 'upstream-spatial',
      message: 'تغییر مکانی بالادستی نیازمند بازبینی برنامه‌ریزی است.',
    });
  }

  if (fixture.reviewBlockerCount > 0) {
    blockers.push({
      code: 'review-blocker',
      message: 'مسدودکننده بررسی داده هنوز باز است.',
    });
  }

  return { canPublish: blockers.length === 0, blockers };
}
