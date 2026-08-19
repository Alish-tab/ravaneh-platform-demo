import type {
  DriverRecord,
  DriverAppAccessStatus,
  DriverOperationalStatus,
  DriverTodayAssignment,
} from '@/features/drivers/model/types';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';

export type CreateDriverInput = {
  name: string;
  phone: string;
  initialStatus: DriverOperationalStatus;
};

export type UpdateDriverInput = {
  name: string;
  phone: string;
};

export type DriversDataPort = {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  listDrivers: () => DriverRecord[];
  getDriver: (driverId: string) => DriverRecord | null;
  createDriver: (input: CreateDriverInput) => Promise<DriverRecord>;
  updateDriver: (driverId: string, input: UpdateDriverInput, expectedVersion: number) => Promise<DriverRecord>;
  activateDriver: (driverId: string) => Promise<void>;
  deactivateDriver: (driverId: string) => Promise<void>;
  setAppAccess: (driverId: string, newStatus: DriverAppAccessStatus) => Promise<void>;
  getTodayAssignments: (driverId: string, todaySortKey: string, plansPort: PlansDataPort) => Promise<DriverTodayAssignment[]>;
  hasFutureAssignments: (driverId: string, todaySortKey: string, plansPort: PlansDataPort) => Promise<boolean>;
};

// ─── Fixture store ────────────────────────────────────────────────────────────

let _nextIdSuffix = 100;

function nextDriverId(): string {
  _nextIdSuffix += 1;
  return `D-${String(_nextIdSuffix).padStart(3, '0')}`;
}

function buildInitialDirectory(): DriverRecord[] {
  const appAccessByIndex: DriverAppAccessStatus[] = [
    'active', 'active', 'none', 'active', 'none',
    'active', 'active', 'none', 'active', 'active',
    'active', 'none', 'active', 'active', 'none',
    'active', 'blocked', 'active', 'active', 'active',
  ];
  const inactiveIds = new Set(['D-020', 'D-017', 'D-019']);

  return PLANNING_DRIVERS.map((pd, i) => ({
    driverId: pd.driverId,
    name: pd.driverName,
    phone: `091${pd.driverId.replace('D-', '').padStart(8, '0')}`,
    operationalStatus: inactiveIds.has(pd.driverId)
      ? ('inactive' as DriverOperationalStatus)
      : ('active' as DriverOperationalStatus),
    appAccessStatus: (appAccessByIndex[i] ?? 'none') as DriverAppAccessStatus,
    version: 1,
  }));
}

export function createDriversFixturePort(delayMs = 200): DriversDataPort {
  let directory: DriverRecord[] = buildInitialDirectory();
  let version = 1;
  const listeners = new Set<() => void>();

  function notify() {
    version += 1;
    listeners.forEach((l) => l());
  }

  function delay() {
    return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }

  const port: DriversDataPort = {
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getVersion() { return version; },

    listDrivers() { return [...directory]; },

    getDriver(driverId) {
      return directory.find((d) => d.driverId === driverId) ?? null;
    },

    async createDriver(input) {
      await delay();
      const rec: DriverRecord = {
        driverId: nextDriverId(),
        name: input.name.trim(),
        phone: input.phone.trim(),
        operationalStatus: input.initialStatus,
        appAccessStatus: 'none',
        version: 1,
      };
      directory = [rec, ...directory];
      notify();
      return rec;
    },

    async updateDriver(driverId, input, expectedVersion) {
      await delay();
      const idx = directory.findIndex((d) => d.driverId === driverId);
      if (idx === -1) throw new Error('DRIVER_NOT_FOUND');
      const current = directory[idx]!;
      if (current.version !== expectedVersion) {
        throw Object.assign(new Error('DRIVER_CONFLICT'), { code: 'DRIVER_CONFLICT' });
      }
      const updated: DriverRecord = {
        ...current,
        name: input.name.trim(),
        phone: input.phone.trim(),
        version: current.version + 1,
      };
      directory = directory.map((d) => (d.driverId === driverId ? updated : d));
      notify();
      return updated;
    },

    async activateDriver(driverId) {
      await delay();
      directory = directory.map((d) =>
        d.driverId === driverId
          ? { ...d, operationalStatus: 'active', version: d.version + 1 }
          : d,
      );
      notify();
    },

    async deactivateDriver(driverId) {
      await delay();
      directory = directory.map((d) =>
        d.driverId === driverId
          ? { ...d, operationalStatus: 'inactive', version: d.version + 1 }
          : d,
      );
      notify();
    },

    async setAppAccess(driverId, newStatus) {
      await delay();
      directory = directory.map((d) =>
        d.driverId === driverId
          ? { ...d, appAccessStatus: newStatus, version: d.version + 1 }
          : d,
      );
      notify();
    },

    async getTodayAssignments(driverId, todaySortKey, plansPort) {
      const plans = await plansPort.listPlans();
      const assignments: DriverTodayAssignment[] = [];

      for (const plan of plans) {
        if (plan.serviceDateSortKey !== todaySortKey) continue;

        const published = plansPort.getPublishedPlanningState(plan.id);
        const working = await plansPort.getPlanningState(plan.id);

        // Prefer Published for operational reality; show Working if not yet published.
        if (published) {
          for (const area of published.areas) {
            if (area.driverId === driverId) {
              assignments.push({
                planId: plan.id,
                planName: plan.name,
                areaId: area.areaId,
                areaLabel: area.label,
                deliveryWindow: '۸–۱۲',
                isPublished: true,
              });
            }
          }
        } else {
          for (const area of working.areas) {
            if (area.driverId === driverId) {
              assignments.push({
                planId: plan.id,
                planName: plan.name,
                areaId: area.areaId,
                areaLabel: area.label,
                deliveryWindow: '۸–۱۲',
                isPublished: false,
              });
            }
          }
        }
      }
      return assignments;
    },

    async hasFutureAssignments(driverId, todaySortKey, plansPort) {
      const plans = await plansPort.listPlans();
      for (const plan of plans) {
        // past — skip
        if (plan.serviceDateSortKey < todaySortKey) continue;

        const published = plansPort.getPublishedPlanningState(plan.id);
        const working = await plansPort.getPlanningState(plan.id);
        const areas = published ? published.areas : working.areas;
        if (areas.some((a) => a.driverId === driverId)) return true;
      }
      return false;
    },
  };

  return port;
}
