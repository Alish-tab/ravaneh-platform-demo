import type {
  PlanningArea,
  PlanningDeliveryTask,
  PlanningPlanFixture,
  PlanningRoute,
  PlanningStop,
} from '@/features/planning/fixture/types';
import { findRouteForArea, syncAreaMembership } from '@/features/planning/planning-model';

/**
 * Compact Planning map fixture — designer-parity marker/panel states without Figma volume.
 * Seed defaults match demo plan P-2404 labels; factory clones per planId.
 */
export const PLANNING_FIXTURE_PLAN_ID = 'P-2404';

function task(
  taskId: string,
  orderId: string,
  recipientName: string,
  address: string,
  phone: string,
): PlanningDeliveryTask {
  return { taskId, orderId, recipientName, address, phone };
}

function stop(
  stopId: string,
  seq: number,
  lat: number,
  lng: number,
  tasks: PlanningDeliveryTask[],
  raw: { lat: number; lng: number } = { lat, lng },
): PlanningStop {
  return { stopId, seq, lat, lng, rawLat: raw.lat, rawLng: raw.lng, tasks };
}

function area(partial: Omit<PlanningArea, 'memberStopIds'> & { memberStopIds?: string[] }): PlanningArea {
  return syncAreaMembership({
    ...partial,
    memberStopIds: partial.memberStopIds ?? partial.stops.map((item) => item.stopId),
  });
}

function routeFor(areaItem: PlanningArea, extra: Partial<PlanningRoute> = {}): PlanningRoute {
  return {
    routeId: extra.routeId ?? areaItem.areaId.replace(/^A-/, 'RT-'),
    areaId: areaItem.areaId,
    orderedStopIds: extra.orderedStopIds ?? areaItem.stops.map((item) => item.stopId),
    dirty: extra.dirty ?? false,
    recalcState: extra.recalcState ?? 'idle',
    distanceKm: extra.distanceKm ?? 30,
    durationMin: extra.durationMin ?? 80,
  };
}

const AREA_1 = area({
  areaId: 'A-01',
  label: 'محدوده ۱',
  color: '#7a8fd0',
  driverId: 'D-041',
  driverName: 'کاوه میرزایی',
  driverAssignmentLocked: false,
  planState: 'assigned',
  stops: [
    stop('S-101', 1, 35.747, 51.362, [
      task('T-1001', '10123456', 'علی احمدی', 'میرداماد، بلوار کلانتری، پلاک ۱۲', '0912-111-0101'),
    ]),
    stop('S-102', 2, 35.74, 51.38, [
      task('T-1002a', '10123457', 'سارا موسوی', 'میرداماد، کوچه نهم، واحد ۳', '0912-222-0202'),
      task('T-1002b', '10123458', 'رضا نجفی', 'میرداماد، کوچه نهم، واحد ۷', '0912-333-0303'),
    ]),
    stop('S-103', 3, 35.734, 51.368, [
      task('T-1003', '10123891', 'محمد رضایی', 'داروس، خیابان اصلی، پلاک ۸', '0912-444-0404'),
    ]),
    stop('S-104', 4, 35.728, 51.396, [
      task('T-1004', '10124002', 'فاطمه کریمی', 'اقدسیه، بلوار اصلی، پلاک ۴', '0912-555-0505'),
    ]),
  ],
});

const AREA_2 = area({
  areaId: 'A-02',
  label: 'محدوده ۲',
  color: '#9a78a8',
  driverId: 'D-038',
  driverName: 'سعید ابراهیمی',
  driverAssignmentLocked: false,
  planState: 'modified',
  stops: [
    stop('S-201', 1, 35.692, 51.426, [
      task('T-2001', '10125001', 'ندا قاسمی', 'پاسداران، بلوار اول، پلاک ۶', '0912-666-0606'),
    ]),
    stop('S-202', 2, 35.686, 51.441, [
      task('T-2002', '10125002', 'حسن طاهری', 'پاسداران، خیابان ششم، پلاک ۲', '0912-777-0707'),
    ]),
    stop('S-203', 3, 35.675, 51.457, [
      task('T-2003', '10125003', 'شیرین جعفری', 'شریعتی، کوچه پنجم، پلاک ۹', '0912-888-0808'),
    ]),
  ],
});

const AREA_3 = area({
  areaId: 'A-03',
  label: 'محدوده ۳',
  color: '#5e8ab8',
  driverId: null,
  driverName: null,
  driverAssignmentLocked: false,
  planState: 'draft',
  stops: [
    stop('S-301', 1, 35.68, 51.366, [
      task('T-3001', '10126001', 'رامین وزیری', 'سعادت‌آباد، میدان کاج، پلاک ۵', '0912-999-0909'),
    ]),
    stop('S-302', 2, 35.674, 51.38, [
      task('T-3002', '10126002', 'آزاده صمدی', 'سعادت‌آباد، بلوار ایران، پلاک ۱۱', '0935-111-1010'),
    ]),
    stop('S-303', 3, 35.662, 51.395, [
      task('T-3003', '10126003', 'داوود منصوری', 'ونک، خیابان برزیل، پلاک ۳', '0935-222-1111'),
    ]),
  ],
});

const UNASSIGNED: PlanningStop[] = [
  stop('U-001', 0, 35.709, 51.452, [
    task('TU-001', '10129001', 'بیژن کاظمی', 'قیطریه، بلوار اصلی، پلاک ۳', '0935-333-1212'),
  ]),
  stop('U-002', 0, 35.682, 51.373, [
    task('TU-002', '10129102', 'گلنار عباسی', 'سعادت‌آباد، خیابان ۱۵، واحد ۲', '0935-444-1313'),
    task('TU-003', '10129103', 'فریدون حمیدی', 'سعادت‌آباد، خیابان ۱۵، واحد ۶', '0935-555-1414'),
  ]),
];

const PLANNING_FIXTURE_SEED: PlanningPlanFixture = {
  planId: PLANNING_FIXTURE_PLAN_ID,
  planName: 'برنامه تحویل — ۱۴ مرداد — ۱۵ تا ۱۸',
  depot: { name: 'مرکز توزیع تهران', lat: 35.695, lng: 51.389 },
  areas: [AREA_1, AREA_2, AREA_3],
  routes: [
    routeFor(AREA_1, { routeId: 'RT-01', distanceKm: 38, durationMin: 95 }),
    routeFor(AREA_2, {
      routeId: 'RT-02',
      distanceKm: 44,
      durationMin: 112,
      dirty: true,
      recalcState: 'required',
    }),
    routeFor(AREA_3, { routeId: 'RT-03', distanceKm: 28, durationMin: 74 }),
  ],
  unassignedStops: UNASSIGNED,
  generationPhase: 'generated',
  targetAreaCount: 3,
  lockAssignmentsOnRebuild: false,
  reviewBlockerCount: 0,
  eligibleOrderCount: 14,
  upstreamSpatialAttention: false,
};

export type CreatePlanningFixtureOptions = {
  planName?: string;
  generationPhase?: PlanningPlanFixture['generationPhase'];
};

/**
 * Build an independent Planning map/panel fixture for tests and canned generation.
 * Always returns a deep clone — never shares mutable state across plans.
 */
export function createPlanningFixture(
  planId: string,
  options?: CreatePlanningFixtureOptions,
): PlanningPlanFixture {
  const fixture = structuredClone(PLANNING_FIXTURE_SEED);
  fixture.planId = planId;
  if (options?.planName) {
    fixture.planName = options.planName;
  }
  if (options?.generationPhase) {
    fixture.generationPhase = options.generationPhase;
  }
  return fixture;
}

/**
 * @deprecated Independent universe. Prefer PlansDataPort.getPlanningState.
 * Kept for isolated workspace tests that pass initialFixture.
 */
export function getPlanningFixture(
  planId: string,
  options?: CreatePlanningFixtureOptions,
): PlanningPlanFixture {
  return createPlanningFixture(planId, options);
}

/** Canonical P-2404 snapshot for tests/defaults — do not mutate in place. */
export const PLANNING_PLAN_FIXTURE: PlanningPlanFixture =
  createPlanningFixture(PLANNING_FIXTURE_PLAN_ID);

export function findStopInPlan(
  fixture: PlanningPlanFixture,
  stopId: string,
): { area: PlanningArea | null; route: PlanningRoute | null; stop: PlanningStop } | null {
  for (const areaItem of fixture.areas) {
    const found = areaItem.stops.find((item) => item.stopId === stopId);
    if (found) {
      return {
        area: areaItem,
        route: findRouteForArea(fixture, areaItem.areaId),
        stop: found,
      };
    }
  }
  const unassigned = fixture.unassignedStops.find((item) => item.stopId === stopId);
  if (unassigned) return { area: null, route: null, stop: unassigned };
  return null;
}

export function shortAddress(address: string): string {
  return address.split(/،|—/)[0]?.trim() ?? address;
}

export function countPlanOrders(fixture: PlanningPlanFixture): number {
  const assigned = fixture.areas.reduce(
    (sum, areaItem) => sum + areaItem.stops.reduce((inner, item) => inner + item.tasks.length, 0),
    0,
  );
  const unassigned = fixture.unassignedStops.reduce((sum, item) => sum + item.tasks.length, 0);
  return assigned + unassigned;
}

export function countPlanStops(fixture: PlanningPlanFixture): number {
  return fixture.areas.reduce((sum, areaItem) => sum + areaItem.stops.length, 0) + fixture.unassignedStops.length;
}

export function allStopPositions(fixture: PlanningPlanFixture): [number, number][] {
  const points: [number, number][] = [];
  for (const areaItem of fixture.areas) {
    for (const item of areaItem.stops) {
      points.push([item.lat, item.lng]);
    }
  }
  for (const item of fixture.unassignedStops) {
    points.push([item.lat, item.lng]);
  }
  if (fixture.depot) {
    points.push([fixture.depot.lat, fixture.depot.lng]);
  }
  return points;
}

/** Explicit Physical Stop grouping for P-2404 Working dataset (not coordinate merge in UI). */
export const P2404_PHYSICAL_STOP_GROUPS: string[][] = [
  ['10123457', '10123458'],
  ['10129102', '10129103'],
];

export const P2405_PHYSICAL_STOP_GROUPS: string[][] = [['D-1042', 'D-1045']];
