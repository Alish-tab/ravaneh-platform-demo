import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { AppLayout } from '@/app/layouts/AppLayout';
import { DriversPage } from '@/features/drivers/pages/DriversPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { ImportsPage } from '@/features/import-review/pages/ImportsPage';
import { MapSmokePage } from '@/features/map-smoke/pages/MapSmokePage';
import { NotFoundPage } from '@/features/not-found/pages/NotFoundPage';
import { PlanningPage } from '@/features/planning/pages/PlanningPage';
import { PlansPage } from '@/features/plans/pages/PlansPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'imports', element: <ImportsPage /> },
      { path: 'planning', element: <PlanningPage /> },
      { path: 'drivers', element: <DriversPage /> },
      { path: 'map', element: <MapSmokePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
