/**
 * Temporary Programs + A01 fixture adapter (DEV / frontend development only).
 *
 * Boundary:
 *   UI → PlansDataPort → fixture implementation (this file)
 * Future:
 *   UI → TanStack Query → generated OpenAPI client
 *
 * This module must NOT be treated as a real API or shared domain store.
 */

import {
  createReviewStoreForPlan,
  seedReviewStores,
  type ReviewPlanStore,
} from '@/features/import-review/fixture/review-fixture';
import {
  REVIEW_FIXTURE_FAILURE_VALUE,
  stateFromIssues,
  stripLocationIssues,
} from '@/features/import-review/review-model';
import type {
  ReviewBulkResult,
  ReviewItem,
  ReviewLatLng,
  ReviewTaskUpdate,
} from '@/features/import-review/review-types';
import type {
  A01CreatePlanInput,
  A01ImportedFile,
  A01PlanViewModel,
  A01PresentationStatus,
  A01StructuralErrorKind,
  DatasetDiffViewModel,
  ImportBatchViewModel,
  MergeStrategy,
} from '@/features/plans/a01-types';
import { A01_DEMO_PLANS, FIXTURE_REFERENCE_DATE } from '@/features/plans/fixture/demo-plans';
import { createFrontendDemoDataForImportedPlan } from '@/features/plans/fixture/bootstrap-imported-plan';
import { normalizePlanViewModel, type PlanFixtureSeed } from '@/features/plans/normalize-plan';
import { toServiceDateSortKey } from '@/features/plans/plan-name';
import { lookupDispatchOrder } from '@/features/planning/fixture/dispatch-lookup';
import {
  assignDriverToRoute as applyAssignDriver,
  assignStopToRoute as applyAssignStop,
  generateWorkingAreas,
  p2404ReviewItemsFromPlanningSeed,
  planningReadiness,
  publishWorking,
  removeDriverFromRoute as applyRemoveDriver,
  seedPlanningStores,
  setDriverAssignmentLocked as applyLockDriver,
  beginRecalculateRoutes,
  failRecalculateRoutes,
  recalculateRoutes,
  moveOrderToRoute as applyMoveOrder,
  moveStopToRoute as applyMoveStop,
  removeStopFromRoute as applyRemoveStop,
  updateStopLocation as applyUpdateStopLocation,
  type PlanningPlanStore,
} from '@/features/planning/fixture/planning-store';
import type {
  PlanningDispatchResult,
  PlanningDriver,
  PlanningPlanFixture,
  PlanningPublishReadiness,
  PlanningSystemErrorKind,
} from '@/features/planning/fixture/types';
import type { PlanningLatLng } from '@/features/planning/fixture/update-stop-location';

export type PlansListMode = 'ok' | 'loading' | 'error';

export class PlanningPublishBlockedError extends Error {
  readonly readiness: PlanningPublishReadiness;

  constructor(readiness: PlanningPublishReadiness) {
    super('PLANNING_PUBLISH_BLOCKED');
    this.name = 'PlanningPublishBlockedError';
    this.readiness = structuredClone(readiness);
  }
}

export type UploadInspectResult =
  | { kind: 'ok' }
  | { kind: 'fail-upload' }
  | { kind: 'structural'; error: A01StructuralErrorKind };

export type PlansDataPort = {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  getListMode: () => PlansListMode;
  setListMode: (mode: PlansListMode) => void;
  getReferenceDate: () => string;
  listPlans: () => Promise<A01PlanViewModel[]>;
  getPlan: (id: string) => Promise<A01PlanViewModel | null>;
  createPlan: (input: A01CreatePlanInput) => Promise<A01PlanViewModel>;
  updatePlan: (id: string, patch: Partial<A01PlanViewModel>) => Promise<A01PlanViewModel>;
  deletePlan: (id: string) => Promise<void>;
  inspectUpload: (fileName: string) => UploadInspectResult;
  getDatasetDiff: (fileName?: string) => DatasetDiffViewModel;
  applyImportBatch: (
    id: string,
    batch: ImportBatchViewModel,
    outcome: 'clean' | 'needs_review',
  ) => Promise<A01PlanViewModel>;
  applyDatasetStrategy: (
    id: string,
    strategy: MergeStrategy,
    diff: DatasetDiffViewModel,
    batch?: ImportBatchViewModel,
  ) => Promise<A01PlanViewModel>;
  createWorkingVersion: (id: string) => Promise<A01PlanViewModel>;
  listReviewItems: (planId: string) => Promise<ReviewItem[]>;
  getPublishedReviewItems: (planId: string) => ReviewItem[] | null;
  updateReviewInformation: (
    planId: string,
    reviewItemId: string,
    values: ReviewTaskUpdate,
  ) => Promise<ReviewItem>;
  resolveReviewLocation: (
    planId: string,
    reviewItemId: string,
    coords: ReviewLatLng,
  ) => Promise<ReviewItem>;
  excludeReviewItems: (planId: string, reviewItemIds: string[]) => Promise<ReviewBulkResult>;
  restoreReviewItems: (planId: string, reviewItemIds: string[]) => Promise<ReviewBulkResult>;
  resolveReviewDuplicate: (
    planId: string,
    reviewItemId: string,
    decision: 'both_valid' | 'exclude_current',
  ) => Promise<ReviewItem>;
  setNextReviewSaveFailure: (fail: boolean) => void;
  setNextReviewConflict: (fail: boolean) => void;
  setNextBulkPartialFailure: (fail: boolean) => void;
  getPlanningState: (planId: string) => Promise<PlanningPlanFixture>;
  getPublishedPlanningState: (planId: string) => PlanningPlanFixture | null;
  generatePlanningAreas: (
    planId: string,
    targetCount: number,
    options?: { leaveUnassigned?: boolean },
  ) => Promise<PlanningPlanFixture>;
  rebuildPlanningAreas: (planId: string, targetCount: number) => Promise<PlanningPlanFixture>;
  recalculatePlanningRoutes: (
    planId: string,
    working?: PlanningPlanFixture,
  ) => Promise<PlanningPlanFixture>;
  assignPlanningDriver: (
    planId: string,
    areaId: string,
    driver: PlanningDriver,
  ) => Promise<PlanningPlanFixture>;
  removePlanningDriver: (planId: string, areaId: string) => Promise<PlanningPlanFixture>;
  lockPlanningDriver: (
    planId: string,
    areaId: string,
    locked: boolean,
  ) => Promise<PlanningPlanFixture>;
  assignPlanningStop: (
    planId: string,
    stopId: string,
    areaId: string,
  ) => Promise<PlanningPlanFixture>;
  transferPlanningStop: (
    planId: string,
    stopId: string,
    areaId: string,
  ) => Promise<PlanningPlanFixture>;
  unassignPlanningStop: (planId: string, stopId: string) => Promise<PlanningPlanFixture>;
  transferPlanningOrder: (
    planId: string,
    orderId: string,
    areaId: string,
  ) => Promise<{ fixture: PlanningPlanFixture; destinationStopId: string }>;
  updatePlanningStopLocation: (
    planId: string,
    stopId: string,
    coords: PlanningLatLng,
  ) => Promise<PlanningPlanFixture>;
  setPlanningExcludedOrders: (
    planId: string,
    orderIds: string[],
  ) => Promise<PlanningPlanFixture>;
  getPlanningPublishReadiness: (planId: string) => PlanningPublishReadiness;
  publishPlanning: (
    planId: string,
    working: PlanningPlanFixture,
  ) => Promise<A01PlanViewModel>;
  lookupPlanningDispatch: (planId: string, query: string) => PlanningDispatchResult;
  hasUnpublishedPlanningChanges: (planId: string) => boolean;
  setPlanningRebuildLock: (planId: string, locked: boolean) => void;
  setNextPlanningFailure: (kind: PlanningSystemErrorKind) => void;
  setNextPlanningGenerateFail: (fail: boolean) => void;
  setNextPlanningUnassigned: (fail: boolean) => void;
  isStale: (id: string) => boolean;
  markStale: (id: string, stale?: boolean) => void;
  setNextCreateFailure: (fail: boolean) => void;
  setNextApplyFailure: (fail: boolean) => void;
  reset: (seed?: PlanFixtureSeed[]) => void;
};

function clonePlans(source: PlanFixtureSeed[]): A01PlanViewModel[] {
  return source.map((plan) => normalizePlanViewModel(structuredClone(plan)));
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function inspectUploadFileName(fileName: string): UploadInspectResult {
  if (/fail-upload/i.test(fileName)) return { kind: 'fail-upload' };
  if (/unreadable/i.test(fileName)) return { kind: 'structural', error: 'unreadable' };
  if (/empty-file/i.test(fileName)) return { kind: 'structural', error: 'empty' };
  if (/missing-col/i.test(fileName)) return { kind: 'structural', error: 'missing-columns' };
  if (/\.(txt|csv|pdf)$/i.test(fileName)) return { kind: 'structural', error: 'invalid-type' };
  return { kind: 'ok' };
}

export function fixtureParseOutcomeFromFileName(fileName: string): 'clean' | 'needs_review' {
  return /clean/i.test(fileName) ? 'clean' : 'needs_review';
}

export function fixtureDatasetDiff(fileName?: string): DatasetDiffViewModel {
  if (fileName && /small-diff/i.test(fileName)) {
    return { newCount: 2, changedCount: 1, unchangedCount: 10, missingCount: 1 };
  }
  return { newCount: 12, changedCount: 7, unchangedCount: 140, missingCount: 4 };
}

export function createPlansFixturePort(options?: {
  seed?: PlanFixtureSeed[];
  listDelayMs?: number;
  mutateDelayMs?: number;
  referenceDate?: string;
}): PlansDataPort {
  let plans = clonePlans(options?.seed ?? A01_DEMO_PLANS);
  let reviewStores = seedReviewStores(plans);
  const p2404Review = reviewStores.get('P-2404');
  if (p2404Review && p2404Review.working.length === 0) {
    p2404Review.working = p2404ReviewItemsFromPlanningSeed();
  }
  let planningStores = seedPlanningStores(
    plans,
    new Map([...reviewStores.entries()].map(([id, store]) => [id, store.working])),
  );
  const unpublishedPlanning = new Set<string>();
  const bootstrappedImportedPlans = new Set<string>();
  let listMode: PlansListMode = 'ok';
  let nextCreateFailure = false;
  let nextApplyFailure = false;
  let nextReviewSaveFailure = false;
  let nextReviewConflict = false;
  let nextBulkPartialFailure = false;
  let nextPlanningFailure: PlanningSystemErrorKind = null;
  let nextPlanningGenerateFail = false;
  let nextPlanningUnassigned = false;
  const staleIds = new Set<string>();
  let idSeq = 2409;
  let batchSeq = 1;
  let version = 0;
  const listeners = new Set<() => void>();
  const listDelayMs = options?.listDelayMs ?? 280;
  const mutateDelayMs = options?.mutateDelayMs ?? 350;
  const referenceDate = options?.referenceDate ?? FIXTURE_REFERENCE_DATE;

  const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const replacePlan = (id: string, next: A01PlanViewModel) => {
    const index = plans.findIndex((plan) => plan.id === id);
    if (index < 0) throw new Error('PLAN_NOT_FOUND');
    plans = [...plans.slice(0, index), next, ...plans.slice(index + 1)];
  };

  const ensureReviewStore = (planId: string): ReviewPlanStore => {
    const existing = reviewStores.get(planId);
    if (existing) return existing;
    const plan = plans.find((candidate) => candidate.id === planId);
    const created = plan
      ? createReviewStoreForPlan(plan)
      : { working: [] as ReviewItem[], published: null };
    reviewStores.set(planId, created);
    return created;
  };

  const requirePlan = (planId: string) => {
    const plan = plans.find((candidate) => candidate.id === planId);
    if (!plan) throw new Error('PLAN_NOT_FOUND');
    return plan;
  };

  const requireMutableReview = (planId: string) => {
    const plan = requirePlan(planId);
    if (!(plan.a01Mode === 'editable' || plan.a01Mode === 'working') || !plan.canMutateDataset) {
      throw new Error('REVIEW_READONLY');
    }
    return { plan, store: ensureReviewStore(planId) };
  };

  const ensurePlanningStore = (planId: string): PlanningPlanStore => {
    const existing = planningStores.get(planId);
    if (existing) return existing;
    const plan = requirePlan(planId);
    const review = ensureReviewStore(planId);
    const created = seedPlanningStores([plan], new Map([[planId, review.working]])).get(planId)!;
    planningStores.set(planId, created);
    return created;
  };

  const visiblePlanning = (planId: string): PlanningPlanFixture => {
    const plan = requirePlan(planId);
    const store = ensurePlanningStore(planId);
    if (
      plan.a01Mode === 'published-readonly' ||
      plan.a01Mode === 'completed-readonly'
    ) {
      return structuredClone(store.published ?? store.working);
    }
    return structuredClone(store.working);
  };

  const requireMutablePlanning = (planId: string) => {
    const plan = requirePlan(planId);
    if (plan.a01Mode === 'published-readonly' || plan.a01Mode === 'completed-readonly') {
      throw new Error('PLANNING_READONLY');
    }
    if (plan.a01Mode === 'execution-locked' && plan.lifecycle === 'inProgress') {
      /* mutations other than rebuild may still be restricted by caller */
    }
    return { plan, store: ensurePlanningStore(planId) };
  };

  const guardPlanningMutation = async (opts?: { allowDuringExecution?: boolean }) => {
    await delay(mutateDelayMs);
    if (nextPlanningFailure === 'network') {
      nextPlanningFailure = null;
      throw new Error('PLANNING_NETWORK');
    }
    if (nextPlanningFailure === 'server') {
      nextPlanningFailure = null;
      throw new Error('PLANNING_SERVER');
    }
    if (nextPlanningFailure === 'conflict') {
      nextPlanningFailure = null;
      throw new Error('PLANNING_CONFLICT');
    }
    void opts;
  };

  const markPlanningEdited = (planId: string) => {
    const store = ensurePlanningStore(planId);
    if (store.published) unpublishedPlanning.add(planId);
  };

  const applyUpstreamSpatial = (planId: string, orderId: string, coords?: { lat: number; lng: number }) => {
    const store = planningStores.get(planId);
    if (!store || store.working.generationPhase !== 'generated') return;
    let foundAreaId: string | null = null;
    for (const area of store.working.areas) {
      for (const stop of area.stops) {
        if (stop.tasks.some((task) => task.orderId === orderId || task.taskId === orderId)) {
          foundAreaId = area.areaId;
          if (coords) {
            stop.lat = coords.lat;
            stop.lng = coords.lng;
          }
        }
      }
    }
    const unassigned = store.working.unassignedStops.some((stop) =>
      stop.tasks.some((task) => task.orderId === orderId || task.taskId === orderId),
    );
    if (foundAreaId) {
      store.working = {
        ...store.working,
        upstreamSpatialAttention: true,
        routes: store.working.routes.map((route) =>
          route.areaId === foundAreaId ? { ...route, dirty: true, recalcState: 'required' } : route,
        ),
      };
      markPlanningEdited(planId);
      return;
    }
    if (!unassigned && coords) {
      store.working.unassignedStops = [
        ...store.working.unassignedStops,
        {
          stopId: `U-new-${orderId}`,
          seq: 0,
          lat: coords.lat,
          lng: coords.lng,
          rawLat: coords.lat,
          rawLng: coords.lng,
          tasks: [
            {
              taskId: `T-new-${orderId}`,
              orderId,
              recipientName: 'سفارش جدید',
              address: '',
              phone: '',
            },
          ],
        },
      ];
      store.working.eligibleOrderCount += 1;
      markPlanningEdited(planId);
    }
  };

  const visibleReviewItems = (planId: string): ReviewItem[] => {
    const plan = requirePlan(planId);
    const store = ensureReviewStore(planId);
    if (
      plan.a01Mode === 'published-readonly' ||
      plan.a01Mode === 'execution-locked' ||
      plan.a01Mode === 'completed-readonly'
    ) {
      return structuredClone(store.published ?? store.working);
    }
    return structuredClone(store.working);
  };

  const mutateWorkingItem = (
    planId: string,
    reviewItemId: string,
    update: (item: ReviewItem) => ReviewItem,
  ): ReviewItem => {
    const { store } = requireMutableReview(planId);
    const index = store.working.findIndex((item) => item.reviewItemId === reviewItemId);
    if (index < 0) throw new Error('REVIEW_ITEM_NOT_FOUND');
    const next = update(store.working[index]!);
    store.working = [
      ...store.working.slice(0, index),
      next,
      ...store.working.slice(index + 1),
    ];
    return structuredClone(next);
  };

  const guardReviewMutation = async () => {
    await delay(mutateDelayMs);
    if (nextReviewConflict) {
      nextReviewConflict = false;
      throw new Error('REVIEW_CONFLICT');
    }
    if (nextReviewSaveFailure) {
      nextReviewSaveFailure = false;
      throw new Error('REVIEW_SAVE_FAILED');
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getVersion() {
      return version;
    },

    getListMode() {
      return listMode;
    },

    setListMode(mode) {
      listMode = mode;
      emit();
    },

    getReferenceDate() {
      return referenceDate;
    },

    async listPlans() {
      if (listMode === 'loading') {
        await delay(listDelayMs * 4);
        return clonePlans(plans);
      }
      await delay(listDelayMs);
      if (listMode === 'error') {
        throw new Error('LIST_LOAD_FAILED');
      }
      return clonePlans(plans);
    },

    async getPlan(id) {
      await delay(listDelayMs);
      const found = plans.find((plan) => plan.id === id) ?? null;
      return found ? structuredClone(found) : null;
    },

    async createPlan(input) {
      await delay(mutateDelayMs);
      if (nextCreateFailure) {
        nextCreateFailure = false;
        throw new Error('CREATE_FAILED');
      }
      const plan = normalizePlanViewModel({
        id: `P-${idSeq++}`,
        name: input.name,
        deliveryDate: input.deliveryDate,
        window: input.window,
        serviceDateSortKey: toServiceDateSortKey(input.deliveryDate),
        lastChanged: 'همین الان',
        lifecycle: 'draft',
        needsAttention: 'بدون دیتاست',
        isPreparing: true,
        suggestedSection: 'intake',
        canDeleteDraft: true,
        canMutateDataset: true,
        a01Mode: 'editable',
        currentStage: 'intake',
        status: 'draft',
        importBatches: [],
      });
      plans = [plan, ...plans];
      reviewStores.set(plan.id, { working: [], published: null });
      planningStores.set(
        plan.id,
        seedPlanningStores([plan], new Map([[plan.id, []]])).get(plan.id)!,
      );
      emit();
      return structuredClone(plan);
    },

    async updatePlan(id, patch) {
      await delay(mutateDelayMs / 2);
      const index = plans.findIndex((plan) => plan.id === id);
      if (index < 0) throw new Error('PLAN_NOT_FOUND');
      const current = plans[index]!;
      const next = normalizePlanViewModel({ ...current, ...patch, id: current.id });
      replacePlan(id, next);
      emit();
      return structuredClone(next);
    },

    async deletePlan(id) {
      await delay(mutateDelayMs / 2);
      plans = plans.filter((plan) => plan.id !== id);
      reviewStores.delete(id);
      planningStores.delete(id);
      unpublishedPlanning.delete(id);
      bootstrappedImportedPlans.delete(id);
      emit();
    },

    inspectUpload(fileName) {
      return inspectUploadFileName(fileName);
    },

    getDatasetDiff(fileName) {
      return fixtureDatasetDiff(fileName);
    },

    async applyImportBatch(id, batch, outcome) {
      await delay(mutateDelayMs / 2);
      const current = plans.find((plan) => plan.id === id);
      if (!current) throw new Error('PLAN_NOT_FOUND');
      const nextBatch = { ...batch, id: batch.id || `IB-${batchSeq++}` };
      const importBatches = [...current.importBatches, nextBatch];
      const importedFile: A01ImportedFile = {
        name: nextBatch.filename,
        uploadedAt: nextBatch.uploadedAt,
        rowCount: nextBatch.rowCount,
        parseSummary: nextBatch.parseSummary,
        parseOutcome: outcome,
      };
      const next = normalizePlanViewModel({
        ...current,
        importBatches,
        importedFile,
        itemCount: nextBatch.rowCount,
        lastChanged: 'همین الان',
        status: outcome === 'clean' ? 'ready' : 'review',
        currentStage: 'review',
        suggestedSection: 'review',
        needsAttention: outcome === 'clean' ? null : 'سفارش‌های نیازمند بررسی',
        isPreparing: outcome !== 'clean',
        canDeleteDraft: false,
      });
      const bootstrap = bootstrappedImportedPlans.has(id)
        ? null
        : createFrontendDemoDataForImportedPlan(next);
      if (bootstrap) {
        reviewStores.set(id, bootstrap.review);
        planningStores.set(id, bootstrap.planning);
        bootstrappedImportedPlans.add(id);
      }
      replacePlan(id, next);
      emit();
      return structuredClone(next);
    },

    async applyDatasetStrategy(id, strategy, diff, batch) {
      await delay(mutateDelayMs / 2);
      if (nextApplyFailure) {
        nextApplyFailure = false;
        throw new Error('APPLY_FAILED');
      }
      const current = plans.find((plan) => plan.id === id);
      if (!current) throw new Error('PLAN_NOT_FOUND');
      const nextBatch = batch
        ? { ...batch, id: batch.id || `IB-${batchSeq++}` }
        : undefined;
      const importBatches = nextBatch
        ? [...current.importBatches, nextBatch]
        : current.importBatches;
      const importedFile = nextBatch
        ? {
            name: nextBatch.filename,
            uploadedAt: nextBatch.uploadedAt,
            rowCount: nextBatch.rowCount,
            parseSummary: nextBatch.parseSummary,
            parseOutcome:
              nextBatch.result === 'clean' || nextBatch.result === 'needs_review'
                ? nextBatch.result
                : current.importedFile?.parseOutcome,
          }
        : current.importedFile;
      const baseCount = current.itemCount ?? current.importedFile?.rowCount ?? 0;
      const nextCount =
        strategy === 'full-replace'
          ? baseCount + diff.newCount - diff.missingCount
          : baseCount + diff.newCount;
      const next = normalizePlanViewModel({
        ...current,
        importBatches,
        importedFile,
        itemCount: Math.max(0, nextCount),
        lastChanged: 'همین الان',
        suggestedSection: 'review',
        currentStage: 'review',
        needsAttention:
          diff.newCount + diff.changedCount > 0
            ? 'سفارش‌های نیازمند بررسی'
            : current.needsAttention,
        isPreparing: true,
        publishedSnapshot: current.publishedSnapshot
          ? structuredClone(current.publishedSnapshot)
          : current.publishedSnapshot,
      });
      replacePlan(id, next);
      emit();
      return structuredClone(next);
    },

    async createWorkingVersion(id) {
      await delay(mutateDelayMs / 2);
      const current = plans.find((plan) => plan.id === id);
      if (!current) throw new Error('PLAN_NOT_FOUND');
      const publishedSnapshot = structuredClone({
        itemCount: current.itemCount,
        importBatches: current.importBatches,
      });
      const store = ensureReviewStore(id);
      if (!store.published) {
        store.published = structuredClone(store.working);
      } else if (!current.hasWorkingVersion) {
        store.working = structuredClone(store.published);
      }
      const planning = ensurePlanningStore(id);
      if (!planning.published) {
        if (planning.working.generationPhase === 'generated') {
          planning.published = structuredClone(planning.working);
        }
      } else if (!current.hasWorkingVersion) {
        planning.working = structuredClone(planning.published);
      }
      const next = normalizePlanViewModel({
        ...current,
        publishedSnapshot: current.publishedSnapshot ?? publishedSnapshot,
        hasWorkingVersion: true,
        a01Mode: 'working',
        canMutateDataset: true,
        lastChanged: 'همین الان',
        needsAttention: 'تغییرات منتشرنشده',
        isPreparing: true,
      });
      replacePlan(id, next);
      emit();
      return structuredClone(next);
    },

    async listReviewItems(planId) {
      await delay(listDelayMs);
      return visibleReviewItems(planId);
    },

    getPublishedReviewItems(planId) {
      const store = reviewStores.get(planId);
      return store?.published ? structuredClone(store.published) : null;
    },

    async updateReviewInformation(planId, reviewItemId, values) {
      await guardReviewMutation();
      if (values.name.trim() === REVIEW_FIXTURE_FAILURE_VALUE) {
        throw new Error('REVIEW_SAVE_FAILED');
      }
      const previous = ensureReviewStore(planId).working.find((item) => item.reviewItemId === reviewItemId);
      const next = mutateWorkingItem(planId, reviewItemId, (item) => {
        const phoneValid = /^09\d{9}$/.test(values.phone.replace(/\D/g, ''));
        const issues = phoneValid ? item.issues.filter((issue) => issue !== 'phone') : item.issues;
        return {
          ...item,
          name: values.name,
          phone: values.phone,
          address: values.address,
          issues,
          state: item.state === 'excluded' ? 'excluded' : stateFromIssues(issues),
          overlay: null,
          downstreamImpact: values.address !== item.address ? 'planning' : item.downstreamImpact,
        };
      });
      if (previous && values.address !== previous.address) {
        applyUpstreamSpatial(planId, next.externalOrderId);
      }
      emit();
      return next;
    },

    async resolveReviewLocation(planId, reviewItemId, coords) {
      await guardReviewMutation();
      if (coords.lat === 0 && coords.lng === 0) {
        throw new Error('REVIEW_INVALID_LOCATION');
      }
      const next = mutateWorkingItem(planId, reviewItemId, (item) => {
        const issues = stripLocationIssues(item.issues);
        return {
          ...item,
          resolvedLat: coords.lat,
          resolvedLng: coords.lng,
          locSource: 'manual',
          issues,
          state: item.state === 'excluded' ? 'excluded' : stateFromIssues(issues),
          overlay: null,
          downstreamImpact: 'planning',
        };
      });
      applyUpstreamSpatial(planId, next.externalOrderId, coords);
      emit();
      return next;
    },

    async excludeReviewItems(planId, reviewItemIds) {
      await guardReviewMutation();
      const { store } = requireMutableReview(planId);
      const failedIds = nextBulkPartialFailure
        ? reviewItemIds.slice(-1)
        : ([] as string[]);
      nextBulkPartialFailure = false;
      const failed = new Set(failedIds);
      const succeededIds = reviewItemIds.filter((id) => !failed.has(id));
      const target = new Set(succeededIds);
      store.working = store.working.map((item) =>
        target.has(item.reviewItemId) ? { ...item, state: 'excluded', overlay: null } : item,
      );
      emit();
      return { succeededIds, failedIds };
    },

    async restoreReviewItems(planId, reviewItemIds) {
      await guardReviewMutation();
      const { store } = requireMutableReview(planId);
      const failedIds = nextBulkPartialFailure
        ? reviewItemIds.slice(-1)
        : ([] as string[]);
      nextBulkPartialFailure = false;
      const failed = new Set(failedIds);
      const succeededIds: string[] = [];
      store.working = store.working.map((item) => {
        if (!reviewItemIds.includes(item.reviewItemId) || failed.has(item.reviewItemId)) {
          return item;
        }
        succeededIds.push(item.reviewItemId);
        return {
          ...item,
          state: stateFromIssues(item.issues),
          overlay: null,
        };
      });
      emit();
      return { succeededIds, failedIds };
    },

    async resolveReviewDuplicate(planId, reviewItemId, decision) {
      await guardReviewMutation();
      if (decision === 'exclude_current') {
        const { store } = requireMutableReview(planId);
        store.working = store.working.map((item) =>
          item.reviewItemId === reviewItemId
            ? {
                ...item,
                state: 'excluded',
                duplicateDecision: 'exclude_current',
                overlay: null,
              }
            : item,
        );
        const next = store.working.find((item) => item.reviewItemId === reviewItemId);
        if (!next) throw new Error('REVIEW_ITEM_NOT_FOUND');
        emit();
        return structuredClone(next);
      }
      const next = mutateWorkingItem(planId, reviewItemId, (item) => {
        const issues = item.issues.filter((issue) => issue !== 'dup_order_id');
        return {
          ...item,
          issues,
          state: item.state === 'excluded' ? 'excluded' : stateFromIssues(issues),
          duplicateDecision: 'both_valid',
          overlay: null,
        };
      });
      emit();
      return next;
    },

    setNextReviewSaveFailure(fail) {
      nextReviewSaveFailure = fail;
    },

    setNextReviewConflict(fail) {
      nextReviewConflict = fail;
    },

    setNextBulkPartialFailure(fail) {
      nextBulkPartialFailure = fail;
    },

    async getPlanningState(planId) {
      await delay(listDelayMs / 4);
      return visiblePlanning(planId);
    },

    getPublishedPlanningState(planId) {
      const store = planningStores.get(planId);
      return store?.published ? structuredClone(store.published) : null;
    },

    async generatePlanningAreas(planId, targetCount, options) {
      await guardPlanningMutation();
      const { plan, store } = requireMutablePlanning(planId);
      const review = ensureReviewStore(planId).working;
      const next = generateWorkingAreas(store, review, targetCount, {
        fail: nextPlanningGenerateFail,
        leaveUnassigned: options?.leaveUnassigned || nextPlanningUnassigned,
      });
      nextPlanningGenerateFail = false;
      nextPlanningUnassigned = false;
      planningStores.set(planId, next);
      markPlanningEdited(planId);
      emit();
      void plan;
      return structuredClone(next.working);
    },

    async rebuildPlanningAreas(planId, targetCount) {
      const plan = requirePlan(planId);
      if (plan.a01Mode === 'execution-locked' || plan.lifecycle === 'inProgress') {
        throw new Error('PLANNING_REBUILD_LOCKED');
      }
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const review = ensureReviewStore(planId).working;
      const next = generateWorkingAreas(store, review, targetCount, {
        fail: nextPlanningGenerateFail,
      });
      nextPlanningGenerateFail = false;
      planningStores.set(planId, next);
      markPlanningEdited(planId);
      emit();
      return structuredClone(next.working);
    },

    async recalculatePlanningRoutes(planId, working) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      if (working) {
        if (working.planId !== planId) throw new Error('PLANNING_PLAN_MISMATCH');
        store.working = structuredClone(working);
      }
      store.working = beginRecalculateRoutes(store.working);
      emit();
      await delay(mutateDelayMs);
      if (nextPlanningGenerateFail) {
        nextPlanningGenerateFail = false;
        store.working = failRecalculateRoutes(store.working);
        emit();
        return structuredClone(store.working);
      }
      store.working = recalculateRoutes(store.working);
      markPlanningEdited(planId);
      emit();
      return structuredClone(store.working);
    },

    async assignPlanningDriver(planId, areaId, driver) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyAssignDriver(store.working, areaId, driver);
      if (!next) throw new Error('PLANNING_DRIVER_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async removePlanningDriver(planId, areaId) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyRemoveDriver(store.working, areaId);
      if (!next) throw new Error('PLANNING_DRIVER_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async lockPlanningDriver(planId, areaId, locked) {
      const { store } = requireMutablePlanning(planId);
      const next = applyLockDriver(store.working, areaId, locked);
      if (!next) throw new Error('PLANNING_LOCK_REJECTED');
      store.working = next;
      emit();
      return structuredClone(next);
    },

    async assignPlanningStop(planId, stopId, areaId) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyAssignStop(store.working, stopId, areaId);
      if (!next) throw new Error('PLANNING_ASSIGN_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async transferPlanningStop(planId, stopId, areaId) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyMoveStop(store.working, stopId, areaId);
      if (!next) throw new Error('PLANNING_TRANSFER_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async unassignPlanningStop(planId, stopId) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyRemoveStop(store.working, stopId);
      if (!next) throw new Error('PLANNING_UNASSIGN_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async transferPlanningOrder(planId, orderId, areaId) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const result = applyMoveOrder(store.working, orderId, areaId);
      if (!result) throw new Error('PLANNING_ORDER_TRANSFER_REJECTED');
      store.working = result.fixture;
      markPlanningEdited(planId);
      emit();
      return { fixture: structuredClone(result.fixture), destinationStopId: result.destinationStopId };
    },

    async updatePlanningStopLocation(planId, stopId, coords) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      const next = applyUpdateStopLocation(store.working, stopId, coords);
      if (!next) throw new Error('PLANNING_LOCATION_REJECTED');
      store.working = next;
      markPlanningEdited(planId);
      emit();
      return structuredClone(next);
    },

    async setPlanningExcludedOrders(planId, orderIds) {
      await guardPlanningMutation();
      const { store } = requireMutablePlanning(planId);
      store.working = {
        ...store.working,
        excludedOrderIds: [...new Set(orderIds)],
      };
      markPlanningEdited(planId);
      emit();
      return structuredClone(store.working);
    },

    getPlanningPublishReadiness(planId) {
      const store = ensurePlanningStore(planId);
      return planningReadiness(store.working);
    },

    async publishPlanning(planId, working) {
      await guardPlanningMutation();
      const { plan, store } = requireMutablePlanning(planId);
      if (working.planId !== planId) throw new Error('PLANNING_PLAN_MISMATCH');
      const readiness = planningReadiness(working);
      if (!readiness.canPublish) {
        throw new PlanningPublishBlockedError(readiness);
      }
      const publishedStore = publishWorking({
        ...store,
        working: structuredClone(working),
      });
      planningStores.set(planId, publishedStore);
      unpublishedPlanning.delete(planId);
      const review = ensureReviewStore(planId);
      review.published = structuredClone(review.working);
      const next = normalizePlanViewModel({
        ...plan,
        publishedSnapshot: {
          itemCount: plan.itemCount,
          importBatches: plan.importBatches,
        },
        lifecycle: plan.lifecycle === 'inProgress' ? plan.lifecycle : 'published',
        a01Mode: plan.a01Mode === 'execution-locked' ? plan.a01Mode : 'working',
        hasWorkingVersion: true,
        canMutateDataset: true,
        needsAttention: null,
        isPreparing: false,
        currentStage: 'execution',
        suggestedSection: 'execution',
        lastChanged: 'همین الان',
      });
      replacePlan(planId, next);
      emit();
      return structuredClone(next);
    },

    lookupPlanningDispatch(planId, query) {
      const fixture = visiblePlanning(planId);
      return lookupDispatchOrder(fixture, query);
    },

    hasUnpublishedPlanningChanges(planId) {
      return unpublishedPlanning.has(planId);
    },

    setPlanningRebuildLock(planId, locked) {
      const store = ensurePlanningStore(planId);
      store.working.lockAssignmentsOnRebuild = locked;
      emit();
    },

    setNextPlanningFailure(kind) {
      nextPlanningFailure = kind;
    },

    setNextPlanningGenerateFail(fail) {
      nextPlanningGenerateFail = fail;
    },

    setNextPlanningUnassigned(fail) {
      nextPlanningUnassigned = fail;
    },

    isStale(id) {
      return staleIds.has(id);
    },

    markStale(id, stale = true) {
      if (stale) staleIds.add(id);
      else staleIds.delete(id);
      emit();
    },

    setNextCreateFailure(fail) {
      nextCreateFailure = fail;
    },

    setNextApplyFailure(fail) {
      nextApplyFailure = fail;
    },

    reset(seed) {
      plans = clonePlans(seed ?? A01_DEMO_PLANS);
      reviewStores = seedReviewStores(plans);
      const overlay = reviewStores.get('P-2404');
      if (overlay && overlay.working.length === 0) {
        overlay.working = p2404ReviewItemsFromPlanningSeed();
      }
      planningStores = seedPlanningStores(
        plans,
        new Map([...reviewStores.entries()].map(([id, item]) => [id, item.working])),
      );
      unpublishedPlanning.clear();
      bootstrappedImportedPlans.clear();
      listMode = 'ok';
      nextCreateFailure = false;
      nextApplyFailure = false;
      nextReviewSaveFailure = false;
      nextReviewConflict = false;
      nextBulkPartialFailure = false;
      nextPlanningFailure = null;
      nextPlanningGenerateFail = false;
      nextPlanningUnassigned = false;
      staleIds.clear();
      idSeq = 2409;
      batchSeq = 1;
      emit();
    },
  };
}

/** Default singleton for the Admin app (fixture mode until OpenAPI exists). */
export const defaultPlansFixture = createPlansFixturePort();

export function buildParsedImportedFile(args: {
  fileName: string;
  outcome: 'clean' | 'needs_review';
}): A01ImportedFile {
  if (args.outcome === 'clean') {
    return {
      name: args.fileName,
      uploadedAt: 'همین الان',
      rowCount: 148,
      parseOutcome: 'clean',
      parseSummary: {
        totalRows: 148,
        importedCount: 148,
        locationReviewCount: 0,
        duplicateOrderIdCount: 0,
        otherReviewCount: 0,
      },
    };
  }

  return {
    name: args.fileName,
    uploadedAt: 'همین الان',
    rowCount: 210,
    parseOutcome: 'needs_review',
    parseSummary: {
      totalRows: 210,
      importedCount: 210,
      locationReviewCount: 23,
      duplicateOrderIdCount: 3,
      otherReviewCount: 2,
    },
  };
}

export function statusAfterParse(outcome: 'clean' | 'needs_review'): A01PresentationStatus {
  return outcome === 'clean' ? 'ready' : 'review';
}

export function parsedBatchFromFile(fileName: string, outcome: 'clean' | 'needs_review'): ImportBatchViewModel {
  const file = buildParsedImportedFile({ fileName, outcome });
  return {
    id: `IB-${fileName}`,
    filename: file.name,
    uploadedAt: file.uploadedAt,
    rowCount: file.rowCount,
    result: outcome,
    parseSummary: file.parseSummary,
  };
}
