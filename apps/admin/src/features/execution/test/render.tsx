import { cleanup, render } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createExecutionTestPort, type ExecutionFixturePort } from '@/features/execution/data/fixture-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';

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

export function renderExecution(initialEntry = '/plans/P-2403/execution', port?: ExecutionFixturePort) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const executionPort = port ?? createExecutionTestPort();
  const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
  const view = render(
    <AppProviders plansPort={plansPort} executionPort={executionPort}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, port: executionPort, router };
}
