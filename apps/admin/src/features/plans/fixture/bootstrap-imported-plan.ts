import {
  P2405_REVIEW_ITEMS,
  type ReviewPlanStore,
} from '@/features/import-review/fixture/review-fixture';
import type { ReviewItem } from '@/features/import-review/review-types';
import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { createPlanningFixture } from '@/features/planning/fixture/planning-fixture';
import type { PlanningPlanStore } from '@/features/planning/fixture/planning-store';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';

/**
 * FRONTEND_DEMO_DATA_BOOTSTRAP
 *
 * Temporary frontend-only bootstrap used while imported plan data
 * is not persisted/provided by the backend.
 *
 * BACKEND MIGRATION:
 * Replace ONLY the successful-Intake bootstrap invocation and this template
 * construction with backend-provided imported plan data. Do not remove the
 * downstream Review, Planning, Execution state models, mutations, map behavior,
 * Working/Published snapshots, or publish workflow.
 */

export type FrontendImportedPlanData = {
  review: ReviewPlanStore;
  planning: PlanningPlanStore;
};

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function planToken(planId: string): string {
  return planId.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function createReviewTemplate(planId: string, hash: number): ReviewItem[] {
  const token = planToken(planId);
  const names = P2405_REVIEW_ITEMS.map((item) => item.name);
  const rotation = hash % names.length;

  return structuredClone(P2405_REVIEW_ITEMS).map((item, index) => ({
    ...item,
    reviewItemId: `${token}-${item.reviewItemId}`,
    externalOrderId: `${token}-${item.externalOrderId}`,
    importBatchId: `IB-${token}-DEMO`,
    name: names[(index + rotation) % names.length] ?? item.name,
  }));
}

function createPlanningTemplate(
  plan: Pick<A01PlanViewModel, 'id' | 'name'>,
  hash: number,
): PlanningPlanFixture {
  const token = planToken(plan.id);
  const coordinateOffset = ((hash % 7) - 3) * 0.0002;
  const fixture = createPlanningFixture(plan.id, {
    planName: plan.name,
    generationPhase: 'generated',
  });
  const areaIds = new Map(fixture.areas.map((area) => [area.areaId, `${token}-${area.areaId}`]));
  const stopIds = new Map(
    [...fixture.areas.flatMap((area) => area.stops), ...fixture.unassignedStops].map((stop) => [
      stop.stopId,
      `${token}-${stop.stopId}`,
    ]),
  );

  const cloneStop = (stop: (typeof fixture.unassignedStops)[number]) => ({
    ...stop,
    stopId: stopIds.get(stop.stopId)!,
    lat: stop.lat + coordinateOffset,
    lng: stop.lng + coordinateOffset,
    rawLat: stop.rawLat === null ? null : stop.rawLat + coordinateOffset,
    rawLng: stop.rawLng === null ? null : stop.rawLng + coordinateOffset,
    tasks: stop.tasks.map((task) => ({
      ...task,
      taskId: `${token}-${task.taskId}`,
      orderId: `${token}-${task.orderId}`,
    })),
  });

  fixture.areas = fixture.areas.map((area) => ({
    ...area,
    areaId: areaIds.get(area.areaId)!,
    memberStopIds: area.memberStopIds.map((id) => stopIds.get(id)!),
    stops: area.stops.map(cloneStop),
  }));
  fixture.routes = fixture.routes.map((route) => ({
    ...route,
    routeId: `${token}-${route.routeId}`,
    areaId: areaIds.get(route.areaId)!,
    orderedStopIds: route.orderedStopIds.map((id) => stopIds.get(id)!),
  }));
  fixture.unassignedStops = fixture.unassignedStops.map(cloneStop);
  fixture.excludedOrderIds = [];
  return fixture;
}

export function createFrontendDemoDataForImportedPlan(
  plan: Pick<A01PlanViewModel, 'id' | 'name'>,
): FrontendImportedPlanData {
  const hash = stableHash(plan.id);
  const reviewWorking = createReviewTemplate(plan.id, hash);
  const planningWorking = createPlanningTemplate(plan, hash);

  return {
    review: { working: reviewWorking, published: null },
    planning: { working: planningWorking, published: null },
  };
}
