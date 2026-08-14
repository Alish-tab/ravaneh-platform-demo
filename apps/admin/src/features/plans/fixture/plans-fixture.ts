/**
 * Temporary A01 fixture adapter (DEV / frontend development only).
 *
 * Boundary:
 *   UI → PlansDataPort → fixture implementation (this file)
 * Future:
 *   UI → TanStack Query → generated OpenAPI client
 *
 * This module must NOT be treated as a real API or shared domain store.
 * Final create/replace/upload mutation semantics come from Backend/OpenAPI.
 */

import type {
  A01CreatePlanInput,
  A01ImportedFile,
  A01PlanViewModel,
  A01PresentationStatus,
} from '@/features/plans/a01-types';
import { A01_DEMO_PLANS } from '@/features/plans/fixture/demo-plans';

export type PlansListMode = 'ok' | 'loading' | 'error';

export type PlansDataPort = {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  getListMode: () => PlansListMode;
  setListMode: (mode: PlansListMode) => void;
  listPlans: () => Promise<A01PlanViewModel[]>;
  getPlan: (id: string) => Promise<A01PlanViewModel | null>;
  createPlan: (input: A01CreatePlanInput) => Promise<A01PlanViewModel>;
  updatePlan: (id: string, patch: Partial<A01PlanViewModel>) => Promise<A01PlanViewModel>;
  deletePlan: (id: string) => Promise<void>;
  /** Test/dev: next createPlan call rejects once; form values must be preserved by UI. */
  setNextCreateFailure: (fail: boolean) => void;
  reset: (seed?: A01PlanViewModel[]) => void;
};

function clonePlans(source: A01PlanViewModel[]): A01PlanViewModel[] {
  return structuredClone(source);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function createPlansFixturePort(options?: {
  seed?: A01PlanViewModel[];
  listDelayMs?: number;
  mutateDelayMs?: number;
}): PlansDataPort {
  let plans = clonePlans(options?.seed ?? A01_DEMO_PLANS);
  let listMode: PlansListMode = 'ok';
  let nextCreateFailure = false;
  let idSeq = 2409;
  let version = 0;
  const listeners = new Set<() => void>();
  const listDelayMs = options?.listDelayMs ?? 280;
  const mutateDelayMs = options?.mutateDelayMs ?? 350;

  const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
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
      const plan: A01PlanViewModel = {
        id: `P-${idSeq++}`,
        name: input.name,
        deliveryDate: input.deliveryDate,
        window: input.window,
        currentStage: 'intake',
        status: 'draft',
        lastChanged: 'همین الان',
      };
      plans = [plan, ...plans];
      emit();
      return structuredClone(plan);
    },

    async updatePlan(id, patch) {
      await delay(mutateDelayMs / 2);
      const index = plans.findIndex((plan) => plan.id === id);
      if (index < 0) throw new Error('PLAN_NOT_FOUND');
      const current = plans[index]!;
      const next = { ...current, ...patch, id: current.id };
      plans = [...plans.slice(0, index), next, ...plans.slice(index + 1)];
      emit();
      return structuredClone(next);
    },

    async deletePlan(id) {
      await delay(mutateDelayMs / 2);
      plans = plans.filter((plan) => plan.id !== id);
      emit();
    },

    setNextCreateFailure(fail) {
      nextCreateFailure = fail;
    },

    reset(seed) {
      plans = clonePlans(seed ?? A01_DEMO_PLANS);
      listMode = 'ok';
      nextCreateFailure = false;
      idSeq = 2409;
      emit();
    },
  };
}

/** Default singleton for the Admin app (fixture mode until OpenAPI exists). */
export const defaultPlansFixture = createPlansFixturePort();

/**
 * Fixture helper: apply a successful parse outcome onto a plan.
 * Mutation semantics are temporary — Backend will own final behavior.
 */
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
