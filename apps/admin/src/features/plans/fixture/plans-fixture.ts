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
import { normalizePlanViewModel, type PlanFixtureSeed } from '@/features/plans/normalize-plan';
import { toServiceDateSortKey } from '@/features/plans/plan-name';

export type PlansListMode = 'ok' | 'loading' | 'error';

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
  let listMode: PlansListMode = 'ok';
  let nextCreateFailure = false;
  let nextApplyFailure = false;
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
      listMode = 'ok';
      nextCreateFailure = false;
      nextApplyFailure = false;
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
