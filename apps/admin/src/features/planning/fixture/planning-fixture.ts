import type { PlanningPlanFixture, PlanningRoute, PlanningStop } from '@/features/planning/fixture/types';

/**
 * Compact Planning map fixture — designer-parity marker/panel states without full A03 volume.
 * Seed defaults match demo plan P-2404 labels; factory clones per planId.
 */
export const PLANNING_FIXTURE_PLAN_ID = 'P-2404';

const PLANNING_FIXTURE_SEED: PlanningPlanFixture = {
  planId: PLANNING_FIXTURE_PLAN_ID,
  planName: 'برنامه تحویل — ۱۴ مرداد — ۱۵ تا ۱۸',
  depot: { name: 'مرکز توزیع تهران', lat: 35.695, lng: 51.389 },
  routes: [
    {
      routeId: 'R-01',
      routeNum: 1,
      label: 'محدوده ۱',
      color: '#7a8fd0',
      driverId: 'D-041',
      driverName: 'کاوه میرزایی',
      driverAssignmentLocked: false,
      distanceKm: 38,
      durationMin: 95,
      planState: 'assigned',
      stops: [
        {
          stopId: 'S-101',
          seq: 1,
          lat: 35.747,
          lng: 51.362,
          tasks: [
            {
              taskId: 'T-1001',
              orderId: '10123456',
              recipientName: 'علی احمدی',
              address: 'میرداماد، بلوار کلانتری، پلاک ۱۲',
            },
          ],
        },
        {
          stopId: 'S-102',
          seq: 2,
          lat: 35.74,
          lng: 51.38,
          tasks: [
            {
              taskId: 'T-1002a',
              orderId: '10123457',
              recipientName: 'سارا موسوی',
              address: 'میرداماد، کوچه نهم، واحد ۳',
            },
            {
              taskId: 'T-1002b',
              orderId: '10123458',
              recipientName: 'رضا نجفی',
              address: 'میرداماد، کوچه نهم، واحد ۷',
            },
          ],
        },
        {
          stopId: 'S-103',
          seq: 3,
          lat: 35.734,
          lng: 51.368,
          tasks: [
            {
              taskId: 'T-1003',
              orderId: '10123891',
              recipientName: 'محمد رضایی',
              address: 'داروس، خیابان اصلی، پلاک ۸',
            },
          ],
        },
        {
          stopId: 'S-104',
          seq: 4,
          lat: 35.728,
          lng: 51.396,
          tasks: [
            {
              taskId: 'T-1004',
              orderId: '10124002',
              recipientName: 'فاطمه کریمی',
              address: 'اقدسیه، بلوار اصلی، پلاک ۴',
            },
          ],
        },
      ],
    },
    {
      routeId: 'R-02',
      routeNum: 2,
      label: 'محدوده ۲',
      color: '#9a78a8',
      driverId: 'D-038',
      driverName: 'سعید ابراهیمی',
      driverAssignmentLocked: false,
      distanceKm: 44,
      durationMin: 112,
      planState: 'modified',
      stops: [
        {
          stopId: 'S-201',
          seq: 1,
          lat: 35.692,
          lng: 51.426,
          tasks: [
            {
              taskId: 'T-2001',
              orderId: '10125001',
              recipientName: 'ندا قاسمی',
              address: 'پاسداران، بلوار اول، پلاک ۶',
            },
          ],
        },
        {
          stopId: 'S-202',
          seq: 2,
          lat: 35.686,
          lng: 51.441,
          tasks: [
            {
              taskId: 'T-2002',
              orderId: '10125002',
              recipientName: 'حسن طاهری',
              address: 'پاسداران، خیابان ششم، پلاک ۲',
            },
          ],
        },
        {
          stopId: 'S-203',
          seq: 3,
          lat: 35.675,
          lng: 51.457,
          tasks: [
            {
              taskId: 'T-2003',
              orderId: '10125003',
              recipientName: 'شیرین جعفری',
              address: 'شریعتی، کوچه پنجم، پلاک ۹',
            },
          ],
        },
      ],
    },
    {
      routeId: 'R-03',
      routeNum: 3,
      label: 'محدوده ۳',
      color: '#5e8ab8',
      driverId: null,
      driverName: null,
      driverAssignmentLocked: false,
      distanceKm: 28,
      durationMin: 74,
      planState: 'draft',
      stops: [
        {
          stopId: 'S-301',
          seq: 1,
          lat: 35.68,
          lng: 51.366,
          tasks: [
            {
              taskId: 'T-3001',
              orderId: '10126001',
              recipientName: 'رامین وزیری',
              address: 'سعادت‌آباد، میدان کاج، پلاک ۵',
            },
          ],
        },
        {
          stopId: 'S-302',
          seq: 2,
          lat: 35.674,
          lng: 51.38,
          tasks: [
            {
              taskId: 'T-3002',
              orderId: '10126002',
              recipientName: 'آزاده صمدی',
              address: 'سعادت‌آباد، بلوار ایران، پلاک ۱۱',
            },
          ],
        },
        {
          stopId: 'S-303',
          seq: 3,
          lat: 35.662,
          lng: 51.395,
          tasks: [
            {
              taskId: 'T-3003',
              orderId: '10126003',
              recipientName: 'داوود منصوری',
              address: 'ونک، خیابان برزیل، پلاک ۳',
            },
          ],
        },
      ],
    },
  ],
  unassignedStops: [
    {
      stopId: 'U-001',
      seq: 0,
      lat: 35.709,
      lng: 51.452,
      tasks: [
        {
          taskId: 'TU-001',
          orderId: '10129001',
          recipientName: 'بیژن کاظمی',
          address: 'قیطریه، بلوار اصلی، پلاک ۳',
        },
      ],
    },
    {
      stopId: 'U-002',
      seq: 0,
      lat: 35.682,
      lng: 51.373,
      tasks: [
        {
          taskId: 'TU-002',
          orderId: '10129102',
          recipientName: 'گلنار عباسی',
          address: 'سعادت‌آباد، خیابان ۱۵، واحد ۲',
        },
        {
          taskId: 'TU-003',
          orderId: '10129103',
          recipientName: 'فریدون حمیدی',
          address: 'سعادت‌آباد، خیابان ۱۵، واحد ۶',
        },
      ],
    },
  ],
};

export type CreatePlanningFixtureOptions = {
  planName?: string;
};

/**
 * Build an independent Planning map/panel fixture for a plan id (frontend-only).
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
  return fixture;
}

/**
 * Resolve Planning fixture for a plan-scoped workspace.
 * Frontend-only: any plan that reaches PlanningPage gets deterministic demo map data.
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
): { route: PlanningRoute | null; stop: PlanningStop } | null {
  for (const route of fixture.routes) {
    const stop = route.stops.find((item) => item.stopId === stopId);
    if (stop) return { route, stop };
  }
  const unassigned = fixture.unassignedStops.find((item) => item.stopId === stopId);
  if (unassigned) return { route: null, stop: unassigned };
  return null;
}

export function shortAddress(address: string): string {
  return address.split(/،|—/)[0]?.trim() ?? address;
}

export function countPlanOrders(fixture: PlanningPlanFixture): number {
  const assigned = fixture.routes.reduce(
    (sum, route) => sum + route.stops.reduce((inner, stop) => inner + stop.tasks.length, 0),
    0,
  );
  const unassigned = fixture.unassignedStops.reduce((sum, stop) => sum + stop.tasks.length, 0);
  return assigned + unassigned;
}

export function countPlanStops(fixture: PlanningPlanFixture): number {
  return (
    fixture.routes.reduce((sum, route) => sum + route.stops.length, 0) +
    fixture.unassignedStops.length
  );
}

export function allStopPositions(fixture: PlanningPlanFixture): [number, number][] {
  const points: [number, number][] = [];
  for (const route of fixture.routes) {
    for (const stop of route.stops) {
      points.push([stop.lat, stop.lng]);
    }
  }
  for (const stop of fixture.unassignedStops) {
    points.push([stop.lat, stop.lng]);
  }
  points.push([fixture.depot.lat, fixture.depot.lng]);
  return points;
}
