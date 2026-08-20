/**
 * Plan-scoped Planning store. Lives beside Review on PlansDataPort.
 * Working vs Published copies — edits never mutate Published.
 */

import type { ReviewItem } from '@/features/import-review/review-types';
import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { assignDriverToRoute, removeDriverFromRoute, setDriverAssignmentLocked } from '@/features/planning/fixture/assign-driver';
import { assignStopToRoute } from '@/features/planning/fixture/assign-stop';
import { lookupDispatchOrder } from '@/features/planning/fixture/dispatch-lookup';
import { p2404ReviewItemsFromPlanningSeed } from '@/features/planning/fixture/from-review';
import {
  applyGeneratedAreas,
  beginRecalculateRoutes,
  failRecalculateRoutes,
  recalculateRoutes,
} from '@/features/planning/fixture/generate-areas';
import {
  createPlanningFixture,
  P2404_PHYSICAL_STOP_GROUPS,
  P2405_PHYSICAL_STOP_GROUPS,
  PLANNING_FIXTURE_PLAN_ID,
} from '@/features/planning/fixture/planning-fixture';
import { moveOrderToRoute, moveStopToRoute, removeStopFromRoute } from '@/features/planning/fixture/transfer-stop';
import { updateStopLocation, type PlanningLatLng } from '@/features/planning/fixture/update-stop-location';
import type {
  PlanningDispatchResult,
  PlanningDriver,
  PlanningPlanFixture,
  PlanningPublishReadiness,
  PlanningSystemErrorKind,
} from '@/features/planning/fixture/types';
import {
  eligibleOrdersFromReview,
  evaluatePublishReadiness,
  stopsFromEligibleOrders,
} from '@/features/planning/planning-model';

export type PlanningPlanStore = {
  working: PlanningPlanFixture;
  published: PlanningPlanFixture | null;
};

export type PlanningMutationResult<T = PlanningPlanFixture> =
  | { ok: true; value: T }
  | { ok: false; error: PlanningSystemErrorKind; message: string };

function emptyPlanning(plan: Pick<A01PlanViewModel, 'id' | 'name'>, eligibleCount: number): PlanningPlanFixture {
  return {
    planId: plan.id,
    planName: plan.name,
    depot: null,
    areas: [],
    routes: [],
    unassignedStops: [],
    generationPhase: 'ready',
    targetAreaCount: Math.max(1, Math.min(8, Math.ceil(eligibleCount / 4) || 3)),
    lockAssignmentsOnRebuild: false,
    reviewBlockerCount: 0,
    eligibleOrderCount: eligibleCount,
    upstreamSpatialAttention: false,
  };
}

function physicalStopGroupsFor(planId: string): string[][] {
  if (planId === PLANNING_FIXTURE_PLAN_ID) return P2404_PHYSICAL_STOP_GROUPS;
  if (planId === 'P-2405') return P2405_PHYSICAL_STOP_GROUPS;
  return [];
}

export function buildPlanningInputFromReview(
  plan: Pick<A01PlanViewModel, 'id' | 'name'>,
  reviewItems: ReviewItem[],
): PlanningPlanFixture {
  const eligible = eligibleOrdersFromReview(reviewItems, physicalStopGroupsFor(plan.id));
  const blockers = reviewItems.filter(
    (item) => item.state === 'review' || item.state === 'error',
  ).length;
  const base = emptyPlanning(plan, eligible.length);
  base.reviewBlockerCount = blockers;
  if (plan.id === PLANNING_FIXTURE_PLAN_ID) {
    base.depot = {
      name: 'مرکز توزیع تهران',
      lat: 35.695,
      lng: 51.389,
    };
    base.targetAreaCount = 3;
  }
  return base;
}

export function seedPlanningStores(
  plans: Array<Pick<A01PlanViewModel, 'id' | 'name' | 'a01Mode' | 'lifecycle'>>,
  reviewWorking: Map<string, ReviewItem[]>,
): Map<string, PlanningPlanStore> {
  const stores = new Map<string, PlanningPlanStore>();
  for (const plan of plans) {
    const items = reviewWorking.get(plan.id) ?? [];
    stores.set(plan.id, {
      working: buildPlanningInputFromReview(plan, items),
      published: null,
    });
  }
  return stores;
}

export function clonePlanningStore(store: PlanningPlanStore): PlanningPlanStore {
  return {
    working: structuredClone(store.working),
    published: store.published ? structuredClone(store.published) : null,
  };
}

export function generateWorkingAreas(
  store: PlanningPlanStore,
  reviewItems: ReviewItem[],
  targetCount: number,
  options?: { fail?: boolean; leaveUnassigned?: boolean },
): PlanningPlanStore {
  if (options?.fail) {
    return {
      ...store,
      working: { ...store.working, generationPhase: 'failed', targetAreaCount: targetCount },
    };
  }

  const eligible = eligibleOrdersFromReview(
    reviewItems,
    physicalStopGroupsFor(store.working.planId),
  );
  let stops = stopsFromEligibleOrders(eligible);

  if (store.working.planId === PLANNING_FIXTURE_PLAN_ID && targetCount === 3 && !options?.leaveUnassigned) {
    const canned = createPlanningFixture(store.working.planId, {
      planName: store.working.planName,
      generationPhase: 'generated',
    });
    return { ...store, working: canned };
  }

  const locked = store.working.lockAssignmentsOnRebuild
    ? store.working.areas
        .filter((area) => area.driverAssignmentLocked && area.driverId && area.driverName)
        .map((area) => ({ driverId: area.driverId!, driverName: area.driverName! }))
    : store.working.areas
        .filter((area) => area.driverAssignmentLocked && area.driverId && area.driverName)
        .map((area) => ({ driverId: area.driverId!, driverName: area.driverName! }));

  const working = applyGeneratedAreas(store.working, stops, {
    targetCount,
    leaveUnassigned: options?.leaveUnassigned,
    preserveLockedDrivers: locked,
  });
  working.eligibleOrderCount = eligible.length;
  return { ...store, working };
}

export function publishWorking(store: PlanningPlanStore): PlanningPlanStore {
  const snapshot = structuredClone(store.working);
  snapshot.areas = snapshot.areas.map((area) => ({ ...area, planState: 'published' as const }));
  snapshot.routes = snapshot.routes.map((route) => ({
    ...route,
    dirty: false,
    recalcState: 'idle' as const,
  }));
  return {
    working: structuredClone(snapshot),
    published: structuredClone(snapshot),
  };
}

export function planningReadiness(
  working: PlanningPlanFixture,
  extras?: { excludedOrderIds?: ReadonlySet<string>; mutationInProgress?: boolean },
): PlanningPublishReadiness {
  return evaluatePublishReadiness(working, extras);
}

export function dispatchLookup(
  working: PlanningPlanFixture,
  query: string,
  excluded: ReadonlySet<string>,
): PlanningDispatchResult {
  return lookupDispatchOrder(working, query, excluded);
}

export {
  assignDriverToRoute,
  removeDriverFromRoute,
  setDriverAssignmentLocked,
  assignStopToRoute,
  moveStopToRoute,
  removeStopFromRoute,
  moveOrderToRoute,
  updateStopLocation,
  recalculateRoutes,
  beginRecalculateRoutes,
  failRecalculateRoutes,
  p2404ReviewItemsFromPlanningSeed,
};

export type { PlanningLatLng, PlanningDriver };
