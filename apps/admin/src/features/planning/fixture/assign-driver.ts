import type {
  PlanningDriver,
  PlanningPlanFixture,
} from '@/features/planning/fixture/types';

/**
 * Assign (or change) a driver on a route.
 * Rejects drivers already assigned to a different area (designer picker disables them).
 */
export function assignDriverToRoute(
  fixture: PlanningPlanFixture,
  routeId: string,
  driver: PlanningDriver,
): PlanningPlanFixture | null {
  const target = fixture.routes.find((route) => route.routeId === routeId);
  if (!target) return null;
  if (target.driverId === driver.driverId) return null;

  const heldElsewhere = fixture.routes.some(
    (route) => route.routeId !== routeId && route.driverId === driver.driverId,
  );
  if (heldElsewhere) return null;

  const routes = fixture.routes.map((route) => {
    if (route.routeId !== routeId) return route;
    return {
      ...route,
      driverId: driver.driverId,
      driverName: driver.driverName,
      planState: route.planState === 'published' ? route.planState : ('assigned' as const),
    };
  });

  return { ...fixture, routes };
}

export function removeDriverFromRoute(
  fixture: PlanningPlanFixture,
  routeId: string,
): PlanningPlanFixture | null {
  const target = fixture.routes.find((route) => route.routeId === routeId);
  if (!target?.driverId) return null;

  const routes = fixture.routes.map((route) => {
    if (route.routeId !== routeId) return route;
    return {
      ...route,
      driverId: null,
      driverName: null,
      driverAssignmentLocked: false,
      planState: route.planState === 'published' ? route.planState : ('draft' as const),
    };
  });

  return { ...fixture, routes };
}

/**
 * Lock/unlock an existing driver assignment. Cannot lock a route without a driver.
 */
export function setDriverAssignmentLocked(
  fixture: PlanningPlanFixture,
  routeId: string,
  locked: boolean,
): PlanningPlanFixture | null {
  const target = fixture.routes.find((route) => route.routeId === routeId);
  if (!target) return null;
  if (locked && !target.driverId) return null;
  if (target.driverAssignmentLocked === locked) return fixture;

  const routes = fixture.routes.map((route) => {
    if (route.routeId !== routeId) return route;
    return { ...route, driverAssignmentLocked: locked };
  });

  return { ...fixture, routes };
}
