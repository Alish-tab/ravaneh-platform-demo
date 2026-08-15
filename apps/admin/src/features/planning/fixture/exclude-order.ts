import type { PlanningPlanFixture, PlanningStop } from '@/features/planning/fixture/types';

export type ExcludedOrderIdSet = ReadonlySet<string>;

export function isOrderExcluded(
  excludedOrderIds: ExcludedOrderIdSet,
  orderId: string,
): boolean {
  return excludedOrderIds.has(orderId);
}

export function isUnassignedStopFullyExcluded(
  stop: PlanningStop,
  excludedOrderIds: ExcludedOrderIdSet,
): boolean {
  return stop.tasks.length > 0 && stop.tasks.every((task) => excludedOrderIds.has(task.orderId));
}

export function countUnassignedOrders(fixture: PlanningPlanFixture): number {
  return fixture.unassignedStops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}

export function countOrdersInStops(stops: PlanningStop[]): number {
  return stops.reduce((sum, stop) => sum + stop.tasks.length, 0);
}

/** Excluded orders that still sit in the unassigned queue (resolved for readiness). */
export function countExcludedOrdersInStops(
  stops: PlanningStop[],
  excludedOrderIds: ExcludedOrderIdSet,
): number {
  return stops.reduce(
    (sum, stop) => sum + stop.tasks.filter((task) => excludedOrderIds.has(task.orderId)).length,
    0,
  );
}

export function countExcludedUnassignedOrders(
  fixture: PlanningPlanFixture,
  excludedOrderIds: ExcludedOrderIdSet,
): number {
  return countExcludedOrdersInStops(fixture.unassignedStops, excludedOrderIds);
}

/**
 * Actionable unassigned work remaining for Planning completion / publish readiness.
 * Matches A03 `remainingUnassigned`.
 */
export function countRemainingUnassignedOrders(
  fixture: PlanningPlanFixture,
  excludedOrderIds: ExcludedOrderIdSet,
): number {
  return countUnassignedOrders(fixture) - countExcludedUnassignedOrders(fixture, excludedOrderIds);
}

/** Order IDs on an unassigned stop that are not yet excluded. */
export function actionableOrderIdsOnStop(
  stop: PlanningStop,
  excludedOrderIds: ExcludedOrderIdSet,
): string[] {
  return stop.tasks
    .map((task) => task.orderId)
    .filter((orderId) => !excludedOrderIds.has(orderId));
}

/**
 * Add order IDs to the exclusion set (immutable). Orders stay in the fixture;
 * exclusion is feature-local presentation/readiness state for later dispatch.
 */
export function addExcludedOrderIds(
  excludedOrderIds: ExcludedOrderIdSet,
  orderIds: Iterable<string>,
): Set<string> {
  const next = new Set(excludedOrderIds);
  for (const orderId of orderIds) {
    next.add(orderId);
  }
  return next;
}
