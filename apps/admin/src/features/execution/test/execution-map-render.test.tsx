import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createExecutionTestPort } from '@/features/execution/data/fixture-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';

vi.mock('@/shared/config/env', () => ({
  env: {
    apiBaseUrl: 'http://localhost:8080',
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '© OpenStreetMap contributors',
  },
}));

describe('A04 map render path', () => {
  afterEach(() => {
    cleanup();
  });

  it('mounts a real Leaflet map without the Figma SVG city-grid', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2404/execution'],
    });
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });

    const planId = 'P-2404';
    await plansPort.generatePlanningAreas(planId, 3);
    const planFixture = await plansPort.getPlanningState(planId);
    const areaWithoutDriver = planFixture.areas.find((a) => !a.driverId || !a.driverName);
    if (areaWithoutDriver) {
      const missingDriver = PLANNING_DRIVERS.find((d) => d.driverId === 'D-052') ?? PLANNING_DRIVERS[0]!;
      await plansPort.assignPlanningDriver(planId, areaWithoutDriver.areaId, missingDriver);
    }

    if (planFixture.unassignedStops.some((s) => s.stopId === 'U-001')) {
      await plansPort.assignPlanningStop(planId, 'U-001', 'A-01');
    }
    if (planFixture.unassignedStops.some((s) => s.stopId === 'U-002')) {
      await plansPort.assignPlanningStop(planId, 'U-002', 'A-02');
    }

    await plansPort.recalculatePlanningRoutes(planId);
    await plansPort.publishPlanning(planId);

    const executionPort = createExecutionTestPort(plansPort);

    render(
      <AppProviders plansPort={plansPort} executionPort={executionPort}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByTestId('execution-map')).toBeInTheDocument();
    const leaflet = document.querySelector('.leaflet-container');
    expect(leaflet).toBeTruthy();
    expect(leaflet).toHaveClass('leaflet-container');
    expect(screen.queryByText('MAP REFERENCE · A04')).not.toBeInTheDocument();
    expect(screen.getByLabelText('راهنمای وضعیت تحویل')).toBeInTheDocument();
  });
});
