import type { PlanningDriver } from '@/features/planning/fixture/types';

/**
 * Compact Planning driver catalog for the assignment picker (designer parity).
 * Not a backend/domain contract.
 */
export const PLANNING_DRIVERS: PlanningDriver[] = [
  { driverId: 'D-001', driverName: 'محمد قاسمی' },
  { driverId: 'D-002', driverName: 'علی رضایی' },
  { driverId: 'D-003', driverName: 'احمد کریمی' },
  { driverId: 'D-004', driverName: 'حسن موسوی' },
  { driverId: 'D-005', driverName: 'رضا احمدی' },
  { driverId: 'D-006', driverName: 'سعید نجفی' },
  { driverId: 'D-007', driverName: 'مجید حسینی' },
  { driverId: 'D-008', driverName: 'فرید صادقی' },
  { driverId: 'D-009', driverName: 'امین طاهری' },
  { driverId: 'D-010', driverName: 'پیمان جعفری' },
  { driverId: 'D-041', driverName: 'کاوه میرزایی' },
  { driverId: 'D-038', driverName: 'سعید ابراهیمی' },
  { driverId: 'D-052', driverName: 'نادر عبادی' },
  { driverId: 'D-014', driverName: 'داوود ملکی' },
  { driverId: 'D-015', driverName: 'جواد نوروزی' },
  { driverId: 'D-016', driverName: 'محسن عبدالهی' },
  { driverId: 'D-017', driverName: 'بهروز اکبری' },
  { driverId: 'D-018', driverName: 'وحید مرادی' },
  { driverId: 'D-019', driverName: 'حمید توکلی' },
  { driverId: 'D-020', driverName: 'مصطفی رحیمی' },
];

export function findPlanningDriver(
  drivers: PlanningDriver[],
  driverId: string,
): PlanningDriver | null {
  return drivers.find((driver) => driver.driverId === driverId) ?? null;
}

/** Map of driverId → area label for routes other than `excludeRouteId`. */
export function buildDriverAreaMap(
  routes: Array<{ routeId: string; label: string; driverId: string | null }>,
  excludeRouteId: string,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const route of routes) {
    if (route.routeId === excludeRouteId || !route.driverId) continue;
    map[route.driverId] = route.label;
  }
  return map;
}

export function countRoutesWithoutDriver(
  routes: Array<{ driverId: string | null }>,
): number {
  return routes.filter((route) => route.driverId === null).length;
}
