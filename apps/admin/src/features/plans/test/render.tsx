import { cleanup, render } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import type { PlanFixtureSeed } from '@/features/plans/normalize-plan';
import {
  createPlansFixturePort,
  type PlansDataPort,
} from '@/features/plans/fixture/plans-fixture';

vi.mock('@/shared/map/BaseMap', () => ({
  BaseMap: () => <div data-testid="base-map-stub">map</div>,
}));

vi.mock('@/features/planning/components/PlanningMap', () => ({
  PlanningMap: () => <div data-testid="planning-map-stub">planning-map</div>,
}));

vi.mock('@/features/execution/components/ExecutionMap', () => ({
  ExecutionMap: () => <div data-testid="execution-map-stub">execution-map</div>,
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

export function createTestPort(seed?: PlanFixtureSeed[]): PlansDataPort {
  return createPlansFixturePort({
    seed,
    listDelayMs: 0,
    mutateDelayMs: 0,
  });
}

export function renderApp(initialEntry = '/', port?: PlansDataPort) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const fixture = port ?? createTestPort();
  const view = render(
    <AppProviders plansPort={fixture}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, port: fixture, router };
}
