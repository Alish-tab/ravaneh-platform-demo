import {
  createCompletedSnapshot,
  createLiveExecutionSnapshot,
  createNotStartedSnapshot,
  EXECUTION_PUBLISHED_PLAN_IDS,
} from '@/features/execution/data/demo-snapshot';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import { ExecutionLoadError, type ExecutionLoadErrorKind } from '@/features/execution/model/types';
import type {
  ExecutionFollowupNote,
  ExecutionOrder,
  ExecutionSnapshot,
  ExecutionSystemNoticeKind,
} from '@/features/execution/model/types';

export type ExecutionWorkspacePreset =
  | 'live'
  | 'loading'
  | 'load-error'
  | 'no-plan'
  | 'not-started'
  | 'completed'
  | 'bg-refresh'
  | 'new-revision';

export type ExecutionFixturePort = ExecutionDataPort & {
  setWorkspacePreset: (preset: ExecutionWorkspacePreset) => void;
  setSystemNotice: (notice: ExecutionSystemNoticeKind) => void;
  setLoadErrorKind: (kind: ExecutionLoadErrorKind) => void;
  holdNextSearch: () => void;
  releaseHeldSearch: () => void;
  setNextSaveFailure: (fail: boolean) => void;
  holdNextSave: () => void;
  releaseHeldSave: () => void;
  reset: () => void;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createExecutionFixturePort(options?: {
  delayMs?: number;
  saveDelayMs?: number;
}): ExecutionFixturePort {
  const delayMs = options?.delayMs ?? 220;
  const saveDelayMs = options?.saveDelayMs ?? 180;

  let version = 0;
  const listeners = new Set<() => void>();
  const store = new Map<string, ExecutionSnapshot>();

  let preset: ExecutionWorkspacePreset = 'live';
  let systemNotice: ExecutionSystemNoticeKind = 'none';
  let loadErrorKind: ExecutionLoadErrorKind = 'network';
  let nextSaveFailure = false;
  let holdSearch = false;
  let heldSearch: {
    planId: string;
    query: string;
    resolve: (value: ExecutionOrder | null) => void;
  } | null = null;
  let holdSave = false;
  let heldSave: {
    planId: string;
    orderId: string;
    note: string;
    resolve: (value: ExecutionFollowupNote) => void;
    reject: (error: unknown) => void;
  } | null = null;
  let noteSeq = 100;

  const seed = () => {
    store.clear();
    store.set('P-2403', createLiveExecutionSnapshot('P-2403', { window: '۱۲ تا ۱۵' }));
    store.set(
      'P-2402',
      createCompletedSnapshot('P-2402', '۸–۱۶'),
    );
  };

  seed();

  const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const snapshotFor = (planId: string): ExecutionSnapshot | null => {
    if (preset === 'no-plan') return null;
    if (!EXECUTION_PUBLISHED_PLAN_IDS.has(planId) && !store.has(planId)) return null;

    let snapshot = store.get(planId);
    if (!snapshot) {
      snapshot = createLiveExecutionSnapshot(planId);
      store.set(planId, snapshot);
    }

    if (preset === 'not-started') {
      return createNotStartedSnapshot(planId, snapshot.deliveryWindow);
    }
    if (preset === 'completed') {
      return createCompletedSnapshot(planId, snapshot.deliveryWindow);
    }
    if (preset === 'new-revision') {
      return { ...clone(snapshot), hasUnpublishedWorkingRevision: true, workingRevisionId: `${planId}-work-2` };
    }
    return clone(snapshot);
  };

  const findOrder = (planId: string, query: string): ExecutionOrder | null => {
    const snapshot = snapshotFor(planId);
    if (!snapshot) return null;
    return snapshot.orders.find((item) => item.id === query.trim()) ?? null;
  };

  const commitNote = (planId: string, orderId: string, note: string): ExecutionFollowupNote => {
    const current = store.get(planId) ?? createLiveExecutionSnapshot(planId);
    noteSeq += 1;
    const saved: ExecutionFollowupNote = {
      id: `fn-${noteSeq}`,
      orderId,
      adminName: 'امین رضایی',
      timestampLabel: '۱۵:۴۸',
      note,
    };
    current.notes = [...current.notes, saved];
    store.set(planId, current);
    emit();
    return saved;
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

    async getSnapshot(planId) {
      if (preset === 'loading') {
        return new Promise<ExecutionSnapshot | null>(() => {
          /* stay pending — tests/UI treat this as initial loading */
        });
      }
      await delay(delayMs);
      if (preset === 'load-error') {
        throw new ExecutionLoadError(
          loadErrorKind,
          loadErrorKind === 'server'
            ? 'server'
            : loadErrorKind === 'conflict'
              ? 'conflict'
              : 'network',
        );
      }
      return snapshotFor(planId);
    },

    async searchOrder(planId, query) {
      if (holdSearch) {
        holdSearch = false;
        return new Promise<ExecutionOrder | null>((resolve) => {
          heldSearch = { planId, query, resolve };
        });
      }
      await delay(Math.min(delayMs, 120));
      return findOrder(planId, query);
    },

    async saveFollowupNote(planId, orderId, note) {
      const run = () => {
        if (nextSaveFailure) {
          nextSaveFailure = false;
          throw new Error('save-failed');
        }
        return commitNote(planId, orderId, note);
      };

      if (holdSave) {
        holdSave = false;
        return new Promise<ExecutionFollowupNote>((resolve, reject) => {
          heldSave = { planId, orderId, note, resolve, reject };
        });
      }

      await delay(saveDelayMs);
      return run();
    },

    getSystemNotice() {
      return systemNotice;
    },

    isBackgroundRefreshing() {
      return preset === 'bg-refresh';
    },

    setWorkspacePreset(next) {
      preset = next;
      if (next === 'bg-refresh') {
        systemNotice = 'none';
      }
    },

    setSystemNotice(notice) {
      systemNotice = notice;
      emit();
    },

    setLoadErrorKind(kind) {
      loadErrorKind = kind;
      emit();
    },

    holdNextSearch() {
      holdSearch = true;
    },

    releaseHeldSearch() {
      if (!heldSearch) return;
      const { planId, query, resolve } = heldSearch;
      heldSearch = null;
      resolve(findOrder(planId, query));
    },

    setNextSaveFailure(fail) {
      nextSaveFailure = fail;
    },

    holdNextSave() {
      holdSave = true;
    },

    releaseHeldSave() {
      if (!heldSave) return;
      const pending = heldSave;
      heldSave = null;
      try {
        if (nextSaveFailure) {
          nextSaveFailure = false;
          pending.reject(new Error('save-failed'));
          return;
        }
        pending.resolve(commitNote(pending.planId, pending.orderId, pending.note));
      } catch (error) {
        pending.reject(error);
      }
    },

    reset() {
      preset = 'live';
      systemNotice = 'none';
      loadErrorKind = 'network';
      nextSaveFailure = false;
      holdSearch = false;
      heldSearch = null;
      holdSave = false;
      heldSave = null;
      noteSeq = 100;
      seed();
      emit();
    },
  };
}

export const defaultExecutionFixture = createExecutionFixturePort();

export function createExecutionTestPort(): ExecutionFixturePort {
  return createExecutionFixturePort({ delayMs: 0, saveDelayMs: 0 });
}
