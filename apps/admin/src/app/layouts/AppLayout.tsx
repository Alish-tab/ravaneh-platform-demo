import { useMemo, useState } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';

import { GlobalNavigation } from '@/app/layouts/GlobalNavigation';
import { GlobalTopContext } from '@/app/layouts/GlobalTopContext';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import '@/app/styles/admin-shell.css';
import '@/features/plans/styles/plan-workspace.css';

function useShellTopContext() {
  const location = useLocation();
  const intakeMatch = useMatch('/plans/:planId/intake');
  const reviewMatch = useMatch('/plans/:planId/review');
  const planMatch = intakeMatch ?? reviewMatch;
  const planId = planMatch?.params.planId;
  const { plan } = usePlan(planId);

  return useMemo(() => {
    if (planMatch) {
      return {
        title: plan?.name ?? 'برنامه',
        breadcrumb: 'برنامه‌ها' as string | undefined,
      };
    }
    if (location.pathname.startsWith('/plans')) {
      return { title: 'برنامه‌ها', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/ops')) {
      return { title: 'عملیات جاری', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/drivers')) {
      return { title: 'رانندگان', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/imports')) {
      return { title: 'ایمپورت', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/planning')) {
      return { title: 'برنامه‌ریزی', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/foundation')) {
      return { title: 'Foundation Smoke', breadcrumb: undefined };
    }
    if (location.pathname.startsWith('/map')) {
      return { title: 'نقشه (Smoke)', breadcrumb: undefined };
    }
    return { title: 'روانه', breadcrumb: undefined };
  }, [location.pathname, plan?.name, planMatch]);
}

export function AppLayout() {
  const [navCollapsed, setNavCollapsed] = useState(false);
  const top = useShellTopContext();

  return (
    <div className="admin-shell">
      <GlobalNavigation
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed((value) => !value)}
      />
      <div className="admin-shell-main">
        <GlobalTopContext title={top.title} breadcrumb={top.breadcrumb} />
        <div className="admin-shell-workspace">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
