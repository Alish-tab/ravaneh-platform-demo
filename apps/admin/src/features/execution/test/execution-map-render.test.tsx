import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createExecutionTestPort } from '@/features/execution/data/fixture-port';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';

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
      initialEntries: ['/plans/P-2403/execution'],
    });
    const plansPort = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const executionPort = createExecutionTestPort();

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
