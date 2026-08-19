/**
 * A05 test render helper.
 *
 * Sets up a full AppProviders + Router context with a fixture OpsHomePort.
 * Plans are seeded from the standard fixture and published for P-2403 (inProgress plan).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createExecutionTestPort } from '@/features/execution/data/fixture-port';
import { createOpsHomePort } from '@/features/ops/port/ops-port';
import type { OpsHomePort } from '@/features/ops/port/ops-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';
import type { PlansDataPort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';

afterEach(() => {
  cleanup();
});

export type OpsTestContext = {
  plansPort: PlansDataPort;
  opsPort: OpsHomePort;
};

export async function renderOps(
  initialEntry = '/ops',
  opts?: { portSetup?: (ctx: OpsTestContext) => void | Promise<void> },
) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });

  // Publish P-2403 (the plan with lifecycle: 'inProgress') so execution has a snapshot.
  const inProgressPlanId = 'P-2403';
  await plansPort.generatePlanningAreas(inProgressPlanId, 2);
  const fixture = await plansPort.getPlanningState(inProgressPlanId);
  const areaWithoutDriver = fixture.areas.find((a) => !a.driverId);
  if (areaWithoutDriver) {
    const driver = PLANNING_DRIVERS.find((d) => d.driverId === 'D-052') ?? PLANNING_DRIVERS[0]!;
    await plansPort.assignPlanningDriver(inProgressPlanId, areaWithoutDriver.areaId, driver);
  }
  const updatedFixture = await plansPort.getPlanningState(inProgressPlanId);
  for (const stop of updatedFixture.unassignedStops) {
    const area = updatedFixture.areas[0];
    if (area) {
      await plansPort.assignPlanningStop(inProgressPlanId, stop.stopId, area.areaId);
    }
  }
  await plansPort.recalculatePlanningRoutes(inProgressPlanId);
  await plansPort.publishPlanning(inProgressPlanId);

  const executionPort = createExecutionTestPort(plansPort);
  const opsPort = createOpsHomePort(plansPort, executionPort);

  const ctx: OpsTestContext = { plansPort, opsPort };
  if (opts?.portSetup) await opts.portSetup(ctx);

  const view = render(
    <AppProviders plansPort={plansPort} executionPort={executionPort} opsPort={opsPort}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, plansPort, opsPort, router };
}
