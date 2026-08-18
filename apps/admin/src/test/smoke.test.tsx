import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';
import { createPlansFixturePort } from '@/features/plans/fixture/plans-fixture';

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

function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
  return render(
    <AppProviders plansPort={port}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

afterEach(() => {
  cleanup();
});

describe('Admin shell smoke', () => {
  it('redirects home to plans and shows the sidebar brand', async () => {
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'برنامه‌ها' })).toBeInTheDocument();
    expect(screen.getByText('روانه')).toBeInTheDocument();
    expect(screen.getByText('RAVANEH')).toBeInTheDocument();
  });

  it('exposes product navigation only', async () => {
    renderApp('/plans');

    const nav = await screen.findByRole('navigation', { name: 'ناوبری اصلی' });
    expect(within(nav).getByRole('link', { name: 'برنامه‌ها' })).toHaveAttribute('href', '/plans');
    expect(within(nav).getByRole('link', { name: 'عملیات جاری' })).toHaveAttribute('href', '/ops');
    expect(within(nav).getByRole('link', { name: 'رانندگان' })).toHaveAttribute('href', '/drivers');

    expect(within(nav).queryByRole('link', { name: 'خانه' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'ایمپورت' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'برنامه‌ریزی' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /نقشه/ })).not.toBeInTheDocument();
  });

  it('keeps foundation smoke route available without product nav entry', async () => {
    renderApp('/foundation');
    expect(await screen.findByRole('heading', { name: 'Foundation Smoke' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'ناوبری اصلی' });
    expect(within(nav).queryByRole('link', { name: /Foundation/i })).not.toBeInTheDocument();
  });
});
