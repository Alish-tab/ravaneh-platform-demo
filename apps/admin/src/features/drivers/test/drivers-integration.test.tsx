import { describe, it, expect } from 'vitest';
import { createDriversFixturePort } from '@/features/drivers/port/drivers-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';
import { jalaliSortKey, dateToJalali } from '@/shared/date/jalali';

function getTodaySortKey(refDate: Date = new Date()): string {
  return jalaliSortKey(dateToJalali(refDate));
}

describe('A06 — Driver Directory + Planning integration', () => {
  it('PLANNING_DRIVERS and A06 directory share same driver IDs', () => {
    const driversPort = createDriversFixturePort(0);
    const directoryIds = new Set(driversPort.listDrivers().map((d) => d.driverId));
    for (const pd of PLANNING_DRIVERS) {
      expect(directoryIds.has(pd.driverId)).toBe(true);
    }
  });

  it('active driver can be used for A03 assignment', async () => {
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const driversPort = createDriversFixturePort(0);
    const activeDriver = driversPort.listDrivers().find((d) => d.operationalStatus === 'active')!;

    await plansPort.generatePlanningAreas('P-2403', 1);
    const state = await plansPort.getPlanningState('P-2403');
    const area = state.areas[0]!;
    const after = await plansPort.assignPlanningDriver('P-2403', area.areaId, {
      driverId: activeDriver.driverId,
      driverName: activeDriver.name,
    });
    expect(after.areas.find((a) => a.areaId === area.areaId)?.driverId).toBe(activeDriver.driverId);
  });

  it('inactive driver is flagged as inactive in directory', () => {
    const driversPort = createDriversFixturePort(0);
    const inactive = driversPort.listDrivers().filter((d) => d.operationalStatus === 'inactive');
    expect(inactive.length).toBeGreaterThan(0);
  });

  it('today assignments are derived from Plan data, not Driver master', async () => {
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const driversPort = createDriversFixturePort(0);
    const driver = driversPort.listDrivers()[0]!;

    // Default fixture plans have serviceDateSortKey != today, so no assignments projected
    const todaySortKey = getTodaySortKey();
    const assignments = await driversPort.getTodayAssignments(driver.driverId, todaySortKey, plansPort);
    // Should be derived from plans — not stored in driver master
    const driverRecord = driversPort.getDriver(driver.driverId);
    expect(driverRecord).not.toHaveProperty('assignments');
    expect(Array.isArray(assignments)).toBe(true);
  });

  it('future assignment projection detects driver in planning data', async () => {
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const driversPort = createDriversFixturePort(0);
    const driver = driversPort.listDrivers()[0]!;

    await plansPort.generatePlanningAreas('P-2403', 2);
    const state = await plansPort.getPlanningState('P-2403');
    const area = state.areas[0]!;

    await plansPort.assignPlanningDriver('P-2403', area.areaId, {
      driverId: driver.driverId,
      driverName: driver.name,
    });

    // Use a past sort key so P-2403's serviceDateSortKey >= past
    const pastKey = '1400-01-01';
    const hasAssignments = await driversPort.hasFutureAssignments(driver.driverId, pastKey, plansPort);
    expect(hasAssignments).toBe(true);
  });

  it('today assignment projection uses published state when available', async () => {
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const driversPort = createDriversFixturePort(0);
    const driver = driversPort.listDrivers()[0]!;

    await plansPort.generatePlanningAreas('P-2403', 2);
    const state = await plansPort.getPlanningState('P-2403');
    // Assign all areas to make plan publishable
    const drivers = driversPort.listDrivers();
    for (let i = 0; i < state.areas.length; i++) {
      const a = state.areas[i]!;
      const d = i === 0 ? driver : drivers[i]!;
      await plansPort.assignPlanningDriver('P-2403', a.areaId, { driverId: d.driverId, driverName: d.name });
    }
    await plansPort.recalculatePlanningRoutes('P-2403');
    await plansPort.publishPlanning('P-2403', await plansPort.getPlanningState('P-2403'));

    const published = plansPort.getPublishedPlanningState('P-2403');
    expect(published).not.toBeNull();

    // Published snapshot has driver assignment
    const assignedArea = published?.areas.find((a) => a.driverId === driver.driverId);
    expect(assignedArea).toBeDefined();
  });

  it('driver IDs are strings, never numeric', () => {
    const driversPort = createDriversFixturePort(0);
    for (const driver of driversPort.listDrivers()) {
      expect(typeof driver.driverId).toBe('string');
      expect(Number.isNaN(Number(driver.driverId))).toBe(true);
    }
  });

  it('driver phone is a string preserving leading zero', () => {
    const driversPort = createDriversFixturePort(0);
    for (const driver of driversPort.listDrivers()) {
      expect(typeof driver.phone).toBe('string');
      expect(driver.phone.startsWith('0')).toBe(true);
    }
  });

  it('version conflict is thrown for stale update', async () => {
    const driversPort = createDriversFixturePort(0);
    const driver = driversPort.listDrivers()[0]!;
    // Update once — version becomes 2
    await driversPort.updateDriver(driver.driverId, { name: 'A', phone: driver.phone }, driver.version);
    // Try again with old version — should throw conflict
    await expect(
      driversPort.updateDriver(driver.driverId, { name: 'B', phone: driver.phone }, driver.version),
    ).rejects.toMatchObject({ code: 'DRIVER_CONFLICT' });
  });

  it('confirms no SAMPLE_DRIVERS or assignments[] in driver master data', () => {
    const driversPort = createDriversFixturePort(0);
    for (const driver of driversPort.listDrivers()) {
      expect(driver).not.toHaveProperty('assignments');
      expect(driver).not.toHaveProperty('active'); // Figma naming
    }
  });
});
