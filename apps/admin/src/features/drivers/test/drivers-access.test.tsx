import { screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import { renderDrivers } from './render';

afterEach(() => cleanup());

describe('A06 — Operational status ≠ App Access', () => {
  it('active operational + blocked app access: both shown independently', async () => {
    const { driversPort: dp } = await renderDrivers();
    const activeDriver = dp.listDrivers().find((d) => d.operationalStatus === 'active')!;
    await dp.setAppAccess(activeDriver.driverId, 'blocked');
    const updated = dp.getDriver(activeDriver.driverId);
    expect(updated?.operationalStatus).toBe('active');
    expect(updated?.appAccessStatus).toBe('blocked');
  });

  it('activating driver does not reset app access', async () => {
    const { driversPort } = await renderDrivers();
    const inactive = driversPort.listDrivers().find((d) => d.operationalStatus === 'inactive')!;
    await driversPort.setAppAccess(inactive.driverId, 'active');
    await driversPort.activateDriver(inactive.driverId);
    const result = driversPort.getDriver(inactive.driverId);
    expect(result?.operationalStatus).toBe('active');
    expect(result?.appAccessStatus).toBe('active');
  });

  it('blocking app access does not change operational status', async () => {
    const { driversPort } = await renderDrivers();
    const active = driversPort.listDrivers().find((d) => d.operationalStatus === 'active')!;
    await driversPort.setAppAccess(active.driverId, 'blocked');
    const result = driversPort.getDriver(active.driverId);
    expect(result?.operationalStatus).toBe('active');
    expect(result?.appAccessStatus).toBe('blocked');
  });

  it('deactivating driver does not change app access', async () => {
    const { driversPort } = await renderDrivers();
    const active = driversPort.listDrivers().find((d) => d.operationalStatus === 'active')!;
    await driversPort.setAppAccess(active.driverId, 'active');
    await driversPort.deactivateDriver(active.driverId);
    const result = driversPort.getDriver(active.driverId);
    expect(result?.operationalStatus).toBe('inactive');
    expect(result?.appAccessStatus).toBe('active');
  });

  it('inactive operational + active app access: both shown independently', async () => {
    const { driversPort } = await renderDrivers();
    const inactive = driversPort.listDrivers().find((d) => d.operationalStatus === 'inactive')!;
    await driversPort.setAppAccess(inactive.driverId, 'active');
    const result = driversPort.getDriver(inactive.driverId);
    expect(result?.operationalStatus).toBe('inactive');
    expect(result?.appAccessStatus).toBe('active');
  });
});

describe('A06 — Deactivate Driver', () => {
  it('deactivates driver via port', async () => {
    const { driversPort } = await renderDrivers();
    const driver = driversPort.listDrivers().find((d) => d.operationalStatus === 'active')!;
    await driversPort.deactivateDriver(driver.driverId);
    const updated = driversPort.getDriver(driver.driverId);
    expect(updated?.operationalStatus).toBe('inactive');
  });

  it('deactivation does NOT auto-unassign areas from plans', async () => {
    const { driversPort, plansPort } = await renderDrivers();

    // Generate and assign a driver to a plan
    await plansPort.generatePlanningAreas('P-2403', 1);
    const state = await plansPort.getPlanningState('P-2403');
    const area = state.areas[0]!;
    const driver = driversPort.listDrivers()[0]!;

    await plansPort.assignPlanningDriver('P-2403', area.areaId, {
      driverId: driver.driverId,
      driverName: driver.name,
    });

    // Deactivate the driver
    await driversPort.deactivateDriver(driver.driverId);

    // Plan assignment remains
    const after = await plansPort.getPlanningState('P-2403');
    const assignedArea = after.areas.find((a) => a.areaId === area.areaId);
    expect(assignedArea?.driverId).toBe(driver.driverId);
    expect(driversPort.getDriver(driver.driverId)?.operationalStatus).toBe('inactive');
  });
});

describe('A06 — App Access actions', () => {
  it('create access: none → active, operational status unchanged', async () => {
    const { driversPort } = await renderDrivers();
    const driver = driversPort.listDrivers().find((d) => d.appAccessStatus === 'none')!;
    const opStatus = driver.operationalStatus;
    await driversPort.setAppAccess(driver.driverId, 'active');
    const updated = driversPort.getDriver(driver.driverId);
    expect(updated?.appAccessStatus).toBe('active');
    expect(updated?.operationalStatus).toBe(opStatus);
  });

  it('block access: active → blocked, operational status unchanged', async () => {
    const { driversPort } = await renderDrivers();
    const driver = driversPort.listDrivers().find((d) => d.appAccessStatus === 'active' && d.operationalStatus === 'active')!;
    await driversPort.setAppAccess(driver.driverId, 'blocked');
    const updated = driversPort.getDriver(driver.driverId);
    expect(updated?.appAccessStatus).toBe('blocked');
    expect(updated?.operationalStatus).toBe('active');
  });

  it('reactivate access: blocked → active, operational status unchanged', async () => {
    const { driversPort } = await renderDrivers();
    const driver = driversPort.listDrivers().find((d) => d.operationalStatus === 'inactive')!;
    await driversPort.setAppAccess(driver.driverId, 'blocked');
    await driversPort.setAppAccess(driver.driverId, 'active');
    const updated = driversPort.getDriver(driver.driverId);
    expect(updated?.appAccessStatus).toBe('active');
    expect(updated?.operationalStatus).toBe('inactive');
  });

  it('shows App Access create dialog without credential exposure', async () => {
    const { driversPort } = await renderDrivers();
    const user = userEvent.setup();
    const driver = driversPort.listDrivers().find((d) => d.appAccessStatus === 'none')!;
    const menuBtns = document.querySelectorAll('.drv-menu-trigger');
    // Find corresponding menu button by index
    const allDrivers = driversPort.listDrivers();
    const driverIdx = allDrivers.findIndex((d) => d.driverId === driver.driverId);
    await user.click(menuBtns[driverIdx]!);
    await user.click(screen.getByRole('menuitem', { name: 'ایجاد دسترسی اپ' }));
    expect(screen.getByRole('dialog', { name: 'ایجاد دسترسی اپ' })).toBeInTheDocument();
    expect(screen.queryByText(/رمز عبور/)).not.toBeInTheDocument();
    expect(screen.queryByText(/کلمه عبور/)).not.toBeInTheDocument();
  });
});

describe('A06 — Historical integrity', () => {
  it('editing driver name does not change plan assignment driverName snapshot', async () => {
    const { driversPort, plansPort } = await renderDrivers();
    await plansPort.generatePlanningAreas('P-2403', 1);
    const state = await plansPort.getPlanningState('P-2403');
    const area = state.areas[0]!;
    const driver = driversPort.listDrivers()[0]!;

    await plansPort.assignPlanningDriver('P-2403', area.areaId, {
      driverId: driver.driverId,
      driverName: driver.name,
    });

    // Publish
    await plansPort.recalculatePlanningRoutes('P-2403');

    // Edit driver name
    await driversPort.updateDriver(driver.driverId, { name: 'اسم جدید', phone: driver.phone }, driver.version);

    // Working plan still has original snapshot name
    const after = await plansPort.getPlanningState('P-2403');
    const assignedArea = after.areas.find((a) => a.areaId === area.areaId);
    expect(assignedArea?.driverName).toBe(driver.name);
    // Directory has new name
    expect(driversPort.getDriver(driver.driverId)?.name).toBe('اسم جدید');
  });
});
