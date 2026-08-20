import { cleanup, render } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createExecutionTestPort, type ExecutionFixturePort } from '@/features/execution/data/fixture-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';

vi.mock('@/shared/map/BaseMap', () => ({
  BaseMap: () => <div data-testid="base-map-stub">map</div>,
}));

vi.mock('@/shared/config/env', () => ({
  env: {
    apiBaseUrl: 'http://localhost:8080',
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '© OpenStreetMap contributors',
  },
}));

afterEach(() => {
  cleanup();
});

export async function renderExecution(
  initialEntry = '/plans/P-2404/execution',
  opts?: { portSetup?: (port: ExecutionFixturePort) => void },
) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });

  // Ensure Published planning exists for the planId being rendered.
  const planId = initialEntry.split('/')[2] ?? 'P-2404';
  await plansPort.generatePlanningAreas(planId, 3);

  // Resolve publish blockers:
  // - assign missing driver(s)
  // - move unassigned stops into areas
  // - clear dirty routes by recalculating
  const planFixture = await plansPort.getPlanningState(planId);

  const areaWithoutDriver = planFixture.areas.find((a) => !a.driverId || !a.driverName);
  if (areaWithoutDriver) {
    const missingDriver =
      PLANNING_DRIVERS.find((d) => d.driverId === 'D-052') ??
      PLANNING_DRIVERS[0]!;
    await plansPort.assignPlanningDriver(planId, areaWithoutDriver.areaId, missingDriver);
  }

  if (planFixture.unassignedStops.some((s) => s.stopId === 'U-001')) {
    await plansPort.assignPlanningStop(planId, 'U-001', 'A-01');
  }
  if (planFixture.unassignedStops.some((s) => s.stopId === 'U-002')) {
    await plansPort.assignPlanningStop(planId, 'U-002', 'A-02');
  }

  await plansPort.recalculatePlanningRoutes(planId);
  await plansPort.publishPlanning(planId, await plansPort.getPlanningState(planId));

  const executionPort = createExecutionTestPort(plansPort);
  if (opts?.portSetup) opts.portSetup(executionPort);
  const view = render(
    <AppProviders plansPort={plansPort} executionPort={executionPort}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, port: executionPort, router };
}
