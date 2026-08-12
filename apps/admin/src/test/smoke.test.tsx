import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { appRoutes } from '@/app/router';

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

function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialEntry] });
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

afterEach(() => {
  cleanup();
});

describe('Admin base smoke', () => {
  it('renders app shell and home route', () => {
    renderApp('/');

    expect(screen.getByText('روانه')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'خانه' })).toBeInTheDocument();
  });

  it('exposes primary navigation routes', () => {
    renderApp('/');

    const nav = screen.getByRole('navigation', { name: 'ناوبری اصلی' });
    expect(within(nav).getByRole('link', { name: 'پلن‌ها' })).toHaveAttribute('href', '/plans');
    expect(within(nav).getByRole('link', { name: 'ایمپورت' })).toHaveAttribute('href', '/imports');
    expect(within(nav).getByRole('link', { name: 'برنامه‌ریزی' })).toHaveAttribute(
      'href',
      '/planning',
    );
    expect(within(nav).getByRole('link', { name: 'راننده‌ها' })).toHaveAttribute(
      'href',
      '/drivers',
    );
  });
});
