import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';
import type { PlanningPlanFixture } from '@/features/planning/fixture/types';
import { buildExecutionAreaPolygon } from '@/features/execution/data/area-geometry';
import { ROUTE_PALETTE_HEX } from '@/shared/map/grammar';
import { toPersianDigits } from '@/shared/lib/format';
import type { ExecutionDataPort } from '@/features/execution/data/port';
import { ExecutionLoadError, type ExecutionLoadErrorKind } from '@/features/execution/model/types';
import type {
  ExecutionAttempt,
  ExecutionFollowupNote,
  ExecutionOrder,
  ExecutionLocation,
  ExecutionStopVisit,
  ExecutionSnapshot,
  ExecutionSystemNoticeKind,
} from '@/features/execution/model/types';
import { FAILURE_REASON_LABEL } from '@/features/execution/model/presentation';

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

export function createExecutionFixturePort(options: {
  plansPort: PlansDataPort;
  delayMs?: number;
  saveDelayMs?: number;
}): ExecutionFixturePort {
  const delayMs = options.delayMs ?? 220;
  const saveDelayMs = options.saveDelayMs ?? 180;
  const plansPort = options.plansPort;

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

  const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  const UNASSIGNED_AREA_ID = 'unassigned';
  const UNASSIGNED_AREA_NAME = 'بدون محدوده';
  const UNASSIGNED_COLOR = ROUTE_PALETTE_HEX[3] ?? '#c99035';

  const failureCodes = Object.keys(FAILURE_REASON_LABEL);

  function stableHash(input: string): number {
    // Deterministic, cheap, and sufficient for fixture UI mapping.
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 31 + input.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function timeLabelFromHash(hash: number): string {
    const hour = 10 + (hash % 6); // 10..15
    const minute = 5 + (hash % 55); // 05..59
    return `${toPersianDigits(hour)}:${toPersianDigits(String(minute).padStart(2, '0'))}`;
  }

  function makeFailureReasonCode(hash: number): string {
    return failureCodes[hash % failureCodes.length] ?? 'closed_door';
  }

  function makeDriverNote(hash: number): string | undefined {
    // Keep it sparse so the UI doesn't look spammy.
    if (hash % 4 !== 0) return undefined;
    return hash % 2 === 0 ? 'نیازمند بررسی دسترسی' : 'در تماس بعدی پیگیری شود';
  }

  function deriveOrderUiStatus(hash: number): ExecutionOrder['uiStatus'] {
    if (preset === 'not-started') return 'pending';

    if (preset === 'completed') {
      const bucket = hash % 5;
      if (bucket === 0) return 'delivered';
      if (bucket === 1) return 'followup';
      return 'delivered';
    }

    // live / bg-refresh / new-revision: keep distribution stable.
    const bucket = hash % 6;
    if (bucket === 0) return 'delivered';
    if (bucket === 1) return 'followup';
    return 'pending';
  }

  function buildAttempts(orderId: string, uiStatus: ExecutionOrder['uiStatus'], failureReasonCode?: string): ExecutionAttempt[] {
    const hash = stableHash(orderId);
    const atLabel = timeLabelFromHash(hash);
    if (uiStatus === 'pending') return [];
    const outcomeCode = uiStatus === 'delivered' ? 'delivered' : failureReasonCode ?? 'closed_door';
    return [{ id: `att-${orderId}-1`, outcomeCode, atLabel }];
  }

  function deriveStopVisits(
    locations: ExecutionLocation[],
    orders: ExecutionOrder[],
    phase: ExecutionSnapshot['phase'],
  ): ExecutionStopVisit[] {
    if (phase === 'not-started') return [];
    return locations.map((location) => {
      const locOrders = orders.filter((o) => o.locationId === location.id);
      const anyDelivered = locOrders.some((o) => o.uiStatus === 'delivered');
      const anyFollowup = locOrders.some((o) => o.uiStatus === 'followup');
      const anyArrived = anyDelivered || anyFollowup;

      const hash = stableHash(location.id);
      const arrivedAtLabel = locOrders[0]?.lastEventLabel ?? timeLabelFromHash(hash);

      return {
        locationId: location.id,
        arrivedAtLabel: anyArrived ? arrivedAtLabel : '—',
        verificationMethod: phase === 'completed' || anyDelivered ? 'gps-verified' : 'manual-verification',
        distanceFromTarget: 50 + (hash % 180),
        gpsAccuracyM: 6 + (hash % 18),
        gpsReason: anyDelivered ? undefined : 'GPS unavailable',
        driverNote: locOrders[0]?.driverNote,
      };
    });
  }

  function createSnapshotFromPublished(planId: string, published: PlanningPlanFixture): ExecutionSnapshot {
    const execAreas: ExecutionSnapshot['areas'] = published.areas.map((area) => {
      return {
        id: area.areaId,
        name: area.label,
        color: area.color,
        driverName: area.driverName ?? '—',
        polygon: buildExecutionAreaPolygon(area.stops),
      };
    });

    const execLocations: ExecutionSnapshot['locations'] = [
      ...published.areas.flatMap((area) =>
        area.stops.map((stop) => ({
          id: stop.stopId,
          areaId: area.areaId,
          address: stop.tasks[0]?.address ?? '—',
          lat: stop.lat,
          lng: stop.lng,
        })),
      ),
      ...(published.unassignedStops.length > 0
        ? published.unassignedStops.map((stop) => ({
            id: stop.stopId,
            areaId: UNASSIGNED_AREA_ID,
            address: stop.tasks[0]?.address ?? '—',
            lat: stop.lat,
            lng: stop.lng,
          }))
        : []),
    ];

    const execAreasWithUnassigned: ExecutionSnapshot['areas'] = [
      ...execAreas,
      ...(published.unassignedStops.length > 0
        ? [
            {
              id: UNASSIGNED_AREA_ID,
              name: UNASSIGNED_AREA_NAME,
              color: UNASSIGNED_COLOR,
              driverName: '—',
              polygon:
                published.unassignedStops.length >= 3
                  ? published.unassignedStops.map((s) => [s.lat, s.lng] as [number, number])
                  : [],
            },
          ]
        : []),
    ];

    const execOrdersBase: ExecutionOrder[] = [];
    for (const area of published.areas) {
      for (const stop of area.stops) {
        for (const task of stop.tasks) {
          const hash = stableHash(task.orderId);
          const uiStatus = deriveOrderUiStatus(hash);
          const failureReasonCode =
            uiStatus === 'followup' ? makeFailureReasonCode(hash) : undefined;
          const driverNote = makeDriverNote(hash);
          const lastEventLabel =
            uiStatus === 'pending' || uiStatus === 'followup' || uiStatus === 'delivered'
              ? timeLabelFromHash(hash)
              : '—';
          execOrdersBase.push({
            id: task.orderId,
            taskId: task.taskId,
            locationId: stop.stopId,
            areaId: area.areaId,
            recipient: task.recipientName,
            phone: task.phone,
            uiStatus,
            lastEventLabel,
            failureReasonCode,
            driverNote,
            attempts: buildAttempts(task.orderId, uiStatus, failureReasonCode),
          });
        }
      }
    }

    for (const stop of published.unassignedStops) {
      for (const task of stop.tasks) {
        const hash = stableHash(task.orderId);
        const uiStatus = deriveOrderUiStatus(hash);
        const failureReasonCode = uiStatus === 'followup' ? makeFailureReasonCode(hash) : undefined;
        const driverNote = makeDriverNote(hash);
        execOrdersBase.push({
          id: task.orderId,
          taskId: task.taskId,
          locationId: stop.stopId,
          areaId: UNASSIGNED_AREA_ID,
          recipient: task.recipientName,
          phone: task.phone,
          uiStatus,
          lastEventLabel: timeLabelFromHash(hash),
          failureReasonCode,
          driverNote,
          attempts: buildAttempts(task.orderId, uiStatus, failureReasonCode),
        });
      }
    }

    // Ensure distribution for live presets (some pending/delivered/followup),
    // so the UI doesn't end up empty.
    if (preset !== 'not-started' && preset !== 'completed') {
      const hasDelivered = execOrdersBase.some((o) => o.uiStatus === 'delivered');
      const hasFollowup = execOrdersBase.some((o) => o.uiStatus === 'followup');
      if (!hasDelivered && execOrdersBase[0]) execOrdersBase[0] = { ...execOrdersBase[0]!, uiStatus: 'delivered', attempts: buildAttempts(execOrdersBase[0]!.id, 'delivered') };
      if (!hasFollowup) {
        const firstPending = execOrdersBase.find((o) => o.uiStatus === 'pending');
        if (firstPending) {
          const hash = stableHash(firstPending.id);
          const failureReasonCode = makeFailureReasonCode(hash);
          execOrdersBase[execOrdersBase.findIndex((o) => o.id === firstPending.id)] = {
            ...firstPending,
            uiStatus: 'followup',
            failureReasonCode,
            attempts: buildAttempts(firstPending.id, 'followup', failureReasonCode),
          };
        }
      }
    }

    const phase = preset === 'not-started' ? 'not-started' : preset === 'completed' ? 'completed' : 'in-progress';
    const orders: ExecutionOrder[] =
      preset === 'not-started'
        ? execOrdersBase.map(
            (o): ExecutionOrder => ({
              ...o,
              uiStatus: 'pending',
              failureReasonCode: undefined,
              driverNote: undefined,
              attempts: [] as ExecutionAttempt[],
            }),
          )
        : execOrdersBase;

    const derivedPhase = phase === 'in-progress' ? ((): ExecutionSnapshot['phase'] => {
      const pending = orders.filter((o) => o.uiStatus === 'pending').length;
      if (pending === 0) return 'completed';
      return 'in-progress';
    })() : phase;

    // Seed follow-up notes deterministically for live/completed presets.
    const followupOrders = orders.filter((o) => o.uiStatus === 'followup');
    const seededNotes: ExecutionFollowupNote[] = [];
    if (derivedPhase !== 'not-started') {
      const pinned = followupOrders.sort((a, b) => a.id.localeCompare(b.id))[0];
      if (pinned) {
        const hash = stableHash(pinned.id);
        seededNotes.push({
          id: `fn-${pinned.id}-1`,
          orderId: pinned.id,
          adminName: 'امین رضایی',
          timestampLabel: timeLabelFromHash(hash),
          note: 'یادداشت اولیه پیگیری',
        });
      }
      // Add a couple extra notes.
      for (const order of followupOrders.slice(1, 4)) {
        if (stableHash(order.id) % 2 === 0) {
          const hash = stableHash(order.id);
          seededNotes.push({
            id: `fn-${order.id}-1`,
            orderId: order.id,
            adminName: 'سارا اکبری',
            timestampLabel: timeLabelFromHash(hash),
            note: 'پیگیری انجام شد',
          });
        }
      }
    }

    const stopVisits = deriveStopVisits(execLocations, orders, derivedPhase);

    return {
      planId,
      publishedRevisionId: `${planId}-pub`,
      workingRevisionId: `${planId}-work`,
      hasUnpublishedWorkingRevision: false, // applied later based on preset.
      deliveryWindow: '۱۲ تا ۱۵',
      lastUpdatedLabel: '۱۴:۳۲',
      phase: derivedPhase,
      areas: execAreasWithUnassigned,
      locations: execLocations,
      orders,
      stopVisits,
      notes: seededNotes,
    };
  }

  const snapshotFor = (planId: string): ExecutionSnapshot | null => {
    if (preset === 'no-plan') return null;

    const published = plansPort.getPublishedPlanningState(planId);
    if (!published) return null;

    const existing = store.get(planId);
    const next = createSnapshotFromPublished(planId, published);

    const preservedNotes = existing?.notes ?? next.notes;
    next.notes = preservedNotes;

    if (preset === 'not-started') {
      next.notes = [];
    }

    if (preset === 'new-revision') {
      next.hasUnpublishedWorkingRevision = true;
      next.workingRevisionId = `${planId}-work-2`;
    } else {
      next.hasUnpublishedWorkingRevision = plansPort.hasUnpublishedPlanningChanges(planId);
    }

    store.set(planId, clone(next));
    return clone(next);
  };

  const findOrder = (planId: string, query: string): ExecutionOrder | null => {
    const snapshot = snapshotFor(planId);
    if (!snapshot) return null;
    return snapshot.orders.find((item) => item.id === query.trim()) ?? null;
  };

  const commitNote = (planId: string, orderId: string, note: string): ExecutionFollowupNote => {
    const current = store.get(planId) ?? snapshotFor(planId);
    if (!current) {
      throw new Error('missing-execution-snapshot');
    }
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
      store.clear();
      emit();
    },
  };
}

export function createExecutionTestPort(plansPort: PlansDataPort): ExecutionFixturePort {
  return createExecutionFixturePort({ plansPort, delayMs: 0, saveDelayMs: 0 });
}
