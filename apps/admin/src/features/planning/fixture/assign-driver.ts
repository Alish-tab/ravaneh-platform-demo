import type {
  PlanningDriver,
  PlanningPlanFixture,
} from '@/features/planning/fixture/types';
import { findArea } from '@/features/planning/planning-model';

/**
 * Assign (or change) a driver on an Area.
 * Rejects drivers already assigned to a different area (picker disables them).
 */
export function assignDriverToRoute(
  fixture: PlanningPlanFixture,
  areaId: string,
  driver: PlanningDriver,
): PlanningPlanFixture | null {
  if (driver.hasPlanConflict) return null;
  const target = findArea(fixture, areaId);
  if (!target) return null;
  if (target.driverId === driver.driverId) return null;

  const heldElsewhere = fixture.areas.some(
    (area) => area.areaId !== areaId && area.driverId === driver.driverId,
  );
  if (heldElsewhere) return null;

  const areas = fixture.areas.map((area) => {
    if (area.areaId !== areaId) return area;
    return {
      ...area,
      driverId: driver.driverId,
      driverName: driver.driverName,
      planState: area.planState === 'published' ? area.planState : ('assigned' as const),
    };
  });

  return { ...fixture, areas };
}

export function removeDriverFromRoute(
  fixture: PlanningPlanFixture,
  areaId: string,
): PlanningPlanFixture | null {
  const target = findArea(fixture, areaId);
  if (!target?.driverId) return null;

  const areas = fixture.areas.map((area) => {
    if (area.areaId !== areaId) return area;
    return {
      ...area,
      driverId: null,
      driverName: null,
      driverAssignmentLocked: false,
      planState: area.planState === 'published' ? area.planState : ('draft' as const),
    };
  });

  return { ...fixture, areas };
}

/**
 * Lock/unlock an existing driver assignment. Cannot lock an area without a driver.
 * Working Planning preference only.
 */
export function setDriverAssignmentLocked(
  fixture: PlanningPlanFixture,
  areaId: string,
  locked: boolean,
): PlanningPlanFixture | null {
  const target = findArea(fixture, areaId);
  if (!target) return null;
  if (locked && !target.driverId) return null;
  if (target.driverAssignmentLocked === locked) return fixture;

  const areas = fixture.areas.map((area) => {
    if (area.areaId !== areaId) return area;
    return { ...area, driverAssignmentLocked: locked };
  });

  return { ...fixture, areas };
}
