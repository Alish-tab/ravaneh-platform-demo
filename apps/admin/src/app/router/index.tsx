import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';

import { AppLayout } from '@/app/layouts/AppLayout';
import { DriversPage } from '@/features/drivers/pages/DriversPage';
import { FoundationSmokePage } from '@/features/foundation-smoke/pages/FoundationSmokePage';
import { ImportsPage } from '@/features/import-review/pages/ImportsPage';
import { ReviewPage } from '@/features/import-review/pages/ReviewPage';
import { MapSmokePage } from '@/features/map-smoke/pages/MapSmokePage';
import { NotFoundPage } from '@/features/not-found/pages/NotFoundPage';
import { OpsPage } from '@/features/ops/pages/OpsPage';
import { PlanIntakePage } from '@/features/plans/intake/PlanIntakePage';
import { PlanningPage } from '@/features/planning/pages/PlanningPage';
import { PlansPage } from '@/features/plans/pages/PlansPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/plans" replace /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'plans/:planId/intake', element: <PlanIntakePage /> },
      { path: 'plans/:planId/review', element: <ReviewPage /> },
      { path: 'plans/:planId/planning', element: <PlanningPage /> },
      { path: 'ops', element: <OpsPage /> },
      { path: 'drivers', element: <DriversPage /> },
      /* Retained routes — not in product navigation */
      { path: 'imports', element: <ImportsPage /> },
      { path: 'map', element: <MapSmokePage /> },
      { path: 'foundation', element: <FoundationSmokePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
