import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';

vi.mock('@/shared/config/env', () => ({
  env: {
    apiBaseUrl: 'http://localhost:8080',
    mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution: '© OpenStreetMap contributors',
  },
}));

/**
 * Intentionally does not mock PlanningMap — proves the real Leaflet shell mounts
 * when the plan-scoped Planning route resolves fixture data.
 */
describe('Planning map render path', () => {
  afterEach(() => {
    cleanup();
  });

  it('mounts PlanningWorkspace + Leaflet container at /plans/P-2404/planning', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2404/planning'],
    });
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });

    render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByTestId('planning-body')).toBeInTheDocument();
    expect(screen.getByTestId('planning-map-pane')).toBeInTheDocument();
    expect(screen.getByTestId('generation-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /برنامه‌ریزی و تخصیص/ })).toHaveAttribute(
      'aria-current',
      'step',
    );

    const leaflet = document.querySelector('.leaflet-container');
    expect(leaflet).toBeTruthy();
    expect(leaflet).toHaveClass('leaflet-container');
    expect(screen.queryByText('داده‌های برنامه‌ریزی برای این برنامه موجود نیست.')).not.toBeInTheDocument();
    expect(screen.queryByText('برنامه یافت نشد.')).not.toBeInTheDocument();
  });

  it('mounts Planning workspace for another eligible plan (P-2403)', async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/plans/P-2403/planning'],
    });
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });

    render(
      <AppProviders plansPort={port}>
        <RouterProvider router={router} />
      </AppProviders>,
    );

    expect(await screen.findByTestId('planning-body')).toBeInTheDocument();
    expect(document.querySelector('.leaflet-container')).toBeTruthy();
    expect(screen.queryByText('داده‌های برنامه‌ریزی برای این برنامه موجود نیست.')).not.toBeInTheDocument();
  });
});
